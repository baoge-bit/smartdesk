use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime,
};

pub fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let quick_analyze = MenuItem::with_id(app, "quick_analyze", "快速分析 / Quick Analyze", true, None::<&str>)?;
    let open_dashboard = MenuItem::with_id(app, "open_dashboard", "打开工作台 / Open Dashboard", true, None::<&str>)?;
    let toggle_schedule = MenuItem::with_id(app, "toggle_schedule", "切换定时任务 / Toggle Schedule", true, None::<&str>)?;
    let check_update = MenuItem::with_id(app, "check_update", "检查更新 / Check for Updates", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "退出 / Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&quick_analyze, &open_dashboard, &toggle_schedule, &check_update, &separator, &quit],
    )?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("AlphaDesk · 阿尔法工作台")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quick_analyze" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("tray-action", "quick-analyze");
                }
            }
            "open_dashboard" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("tray-action", "open-dashboard");
                }
            }
            "toggle_schedule" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-action", "toggle-schedule");
                }
            }
            "check_update" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("tray-action", "check-update");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}