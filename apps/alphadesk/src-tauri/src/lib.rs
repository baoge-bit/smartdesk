mod commands;
mod license;
mod sidecar;
mod tray;

use sidecar::{pick_port, resolve_data_dir, spawn_engine, stop_engine, wait_for_health, SidecarState};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let data_dir = resolve_data_dir();
            let port = pick_port(18765);
            let state = SidecarState::new(data_dir.clone());
            let mut state = state;
            state.port = port;

            // Spawn engine
            match spawn_engine(app.handle(), port, &data_dir) {
                Ok(child) => {
                    if let Ok(mut guard) = state.child.lock() {
                        *guard = Some(child);
                    }
                }
                Err(err) => {
                    log::error!("Failed to start engine: {err}");
                }
            }

            app.manage(state);

            // Health check in background, emit ready event
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let ready = wait_for_health(port, 60).await;
                let _ = handle.emit("engine-ready", serde_json::json!({
                    "ready": ready,
                    "port": port,
                    "apiBaseUrl": format!("http://127.0.0.1:{port}")
                }));
            });

            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_api_base_url,
            commands::get_engine_status,
            commands::show_notification,
            commands::store_secret,
            commands::get_secret,
            commands::delete_secret,
            license::validate_license,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Minimize to tray instead of quitting (desktop app pattern)
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error building AlphaDesk")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app.try_state::<SidecarState>() {
                    stop_engine(&state);
                }
            }
        });
}