use tauri::{AppHandle, State};
use tauri_plugin_notification::NotificationExt;

use crate::sidecar::SidecarState;

#[tauri::command]
pub fn get_api_base_url(state: State<'_, SidecarState>) -> String {
    format!("http://127.0.0.1:{}", state.port)
}

#[tauri::command]
pub fn get_engine_status(state: State<'_, SidecarState>) -> serde_json::Value {
    serde_json::json!({
        "port": state.port,
        "dataDir": state.data_dir.to_string_lossy(),
        "mode": "desktop"
    })
}

#[tauri::command]
pub async fn show_notification(
    app: AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn store_secret(
    app: AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("secrets.json").map_err(|e| e.to_string())?;
    store.set(key, serde_json::Value::String(value));
    store.save().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_secret(app: AppHandle, key: String) -> Result<Option<String>, String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("secrets.json").map_err(|e| e.to_string())?;
    Ok(store
        .get(key)
        .and_then(|v| v.as_str().map(|s| s.to_string())))
}

#[tauri::command]
pub async fn delete_secret(app: AppHandle, key: String) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app.store("secrets.json").map_err(|e| e.to_string())?;
    store.delete(&key);
    store.save().map_err(|e| e.to_string())
}