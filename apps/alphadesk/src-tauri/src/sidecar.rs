use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

pub struct SidecarState {
    pub port: u16,
    pub child: Mutex<Option<Child>>,
    pub data_dir: PathBuf,
}

impl SidecarState {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            port: 18765,
            child: Mutex::new(None),
            data_dir,
        }
    }
}

pub fn resolve_data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("com.alphadesk.app")
}

/// Pick a free localhost port starting from the preferred value.
pub fn pick_port(preferred: u16) -> u16 {
    for port in preferred..preferred.saturating_add(100) {
        if std::net::TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return port;
        }
    }
    preferred
}

pub async fn wait_for_health(port: u16, max_attempts: u32) -> bool {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap_or_default();

    let url = format!("http://127.0.0.1:{port}/api/health");

    for attempt in 0..max_attempts {
        if let Ok(resp) = client.get(&url).send().await {
            if resp.status().is_success() {
                log::info!("Engine health check passed on port {port}");
                return true;
            }
        }
        if attempt < max_attempts - 1 {
            tokio::time::sleep(Duration::from_millis(400)).await;
        }
    }

    log::error!("Engine health check failed on port {port}");
    false
}

/// Start the Python analysis engine.
pub fn spawn_engine(app: &AppHandle, port: u16, data_dir: &PathBuf) -> Result<Child, String> {
    std::fs::create_dir_all(data_dir).map_err(|e| e.to_string())?;
    std::fs::create_dir_all(data_dir.join("logs")).map_err(|e| e.to_string())?;

    // Production: use bundled PyInstaller sidecar binary.
    if let Ok(sidecar) = app
        .shell()
        .sidecar("alphadesk-engine")
        .map_err(|e| e.to_string())
    {
        let (mut rx, _child) = sidecar
            .args([
                "--port",
                &port.to_string(),
                "--data-dir",
                &data_dir.to_string_lossy(),
            ])
            .spawn()
            .map_err(|e| e.to_string())?;

        tauri::async_runtime::spawn(async move {
            while let Some(event) = rx.recv().await {
                match event {
                    tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                        log::info!("[engine] {}", String::from_utf8_lossy(&line));
                    }
                    tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                        log::warn!("[engine] {}", String::from_utf8_lossy(&line));
                    }
                    tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                        log::warn!("[engine] terminated: {:?}", payload);
                        break;
                    }
                    _ => {}
                }
            }
        });

        // Sidecar child is managed by the shell plugin; return a dummy for dev tracking.
        return Command::new("echo")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| e.to_string());
    }

    // Development: spawn system Python with alphadesk_entry.py
    let engine_root = resolve_engine_root();
    let entry = engine_root.join("alphadesk_entry.py");

    if !entry.exists() {
        return Err(format!(
            "Engine entry not found at {}. Run scripts/setup.sh first.",
            entry.display()
        ));
    }

    let python = std::env::var("ALPHADESK_PYTHON").unwrap_or_else(|_| "python3".to_string());

    log::info!(
        "Starting dev engine: {python} {} --port {port}",
        entry.display()
    );

    Command::new(&python)
        .arg(&entry)
        .args(["--port", &port.to_string(), "--data-dir", &data_dir.to_string_lossy()])
        .current_dir(&engine_root)
        .env("ALPHADESK_MODE", "desktop")
        .env("ALPHADESK_API_PORT", port.to_string())
        .env("ALPHADESK_DATA_DIR", data_dir.to_string_lossy().to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn engine ({python}): {e}"))
}

fn resolve_engine_root() -> PathBuf {
    // Walk up from the executable to find engine/ in dev layout.
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        let candidate = PathBuf::from(&manifest)
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("engine"));
        if let Some(ref path) = candidate {
            if path.join("alphadesk_entry.py").exists() {
                return path.clone();
            }
        }
        // apps/alphadesk/src-tauri -> repo root
        let repo = PathBuf::from(&manifest)
            .parent()
            .and_then(|p| p.parent())
            .and_then(|p| p.parent())
            .map(|p| p.join("engine"));
        if let Some(ref path) = repo {
            if path.join("alphadesk_entry.py").exists() {
                return path.clone();
            }
        }
    }
    PathBuf::from("../../engine")
}

pub fn stop_engine(state: &SidecarState) {
    if let Ok(mut guard) = state.child.lock() {
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
        }
    }
}