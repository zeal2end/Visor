use std::fs;
use std::path::PathBuf;
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, Position, Size};

#[cfg(target_os = "macos")]
use cocoa::appkit::{NSApp, NSApplication, NSWindow, NSWindowCollectionBehavior};
#[cfg(target_os = "macos")]
use cocoa::base::{nil, YES};
#[cfg(target_os = "macos")]
#[macro_use]
extern crate objc;

const VISOR_HEIGHT_RATIO: f32 = 0.45;

fn data_path() -> PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".visor")
}

#[tauri::command]
fn load_data() -> Result<String, String> {
    let path = data_path().join("data.json");
    if path.exists() {
        fs::read_to_string(&path).map_err(|e| e.to_string())
    } else {
        Ok("null".to_string())
    }
}

#[tauri::command]
fn save_data(data: String) -> Result<(), String> {
    let dir = data_path();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join("data.json"), data).map_err(|e| e.to_string())
}

/// Configure macOS-specific window behavior: all spaces, high level, collection behavior
#[cfg(target_os = "macos")]
fn configure_macos_window(window: &tauri::WebviewWindow) {
    unsafe {
        if let Ok(ns_window) = window.ns_window() {
            let ns_window = ns_window as cocoa::base::id;

            // Appear on all Spaces/desktops including fullscreen
            let behavior = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary;
            ns_window.setCollectionBehavior_(behavior);

            // Set window level above menu bar (25 = NSMainMenuWindowLevel + 1)
            ns_window.setLevel_(25);
        }
    }
}

/// Position window full-width at the top of the monitor where the cursor is.
/// Uses work_area to respect menu bar and dock.
fn position_on_active_monitor(window: &tauri::WebviewWindow) {
    let monitor = window
        .cursor_position()
        .ok()
        .and_then(|pos| window.monitor_from_point(pos.x, pos.y).ok().flatten())
        .or_else(|| window.current_monitor().ok().flatten())
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let monitor_size = monitor.size();
        let monitor_pos = monitor.position();

        // Use full monitor width, VISOR_HEIGHT_RATIO of height
        let window_height = (monitor_size.height as f32 * VISOR_HEIGHT_RATIO) as u32;

        let _ = window.set_size(Size::Physical(PhysicalSize {
            width: monitor_size.width,
            height: window_height,
        }));

        // Position at top-left of monitor. On macOS the menu bar is handled by
        // the high window level (25) which places us above it.
        let _ = window.set_position(Position::Physical(PhysicalPosition {
            x: monitor_pos.x,
            y: monitor_pos.y,
        }));
    }
}

/// Activate window and bring to foreground (steals focus from other apps)
fn activate_window(window: &tauri::WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();

    #[cfg(target_os = "macos")]
    unsafe {
        let ns_app = NSApp();
        ns_app.activateIgnoringOtherApps_(YES);

        if let Ok(ns_window) = window.ns_window() {
            let ns_window = ns_window as cocoa::base::id;
            let _: () = msg_send![ns_window, makeKeyAndOrderFront: nil];
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_data, save_data])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                // Configure macOS window behavior (all spaces, high level)
                #[cfg(target_os = "macos")]
                configure_macos_window(&window);

                // Position on active monitor BEFORE showing (prevents flash at default size)
                position_on_active_monitor(&window);
                activate_window(&window);
            }

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let toggle_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Backquote);

                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, shortcut, event| {
                            if shortcut == &toggle_shortcut
                                && event.state() == ShortcutState::Pressed
                            {
                                if let Some(window) = app.get_webview_window("main") {
                                    match window.is_visible() {
                                        Ok(true) => {
                                            let _ = window.emit("visor-hide", ());
                                        }
                                        Ok(false) => {
                                            position_on_active_monitor(&window);
                                            activate_window(&window);
                                            let _ = window.emit("visor-show", ());
                                        }
                                        Err(e) => {
                                            eprintln!(
                                                "Error checking window visibility: {}",
                                                e
                                            );
                                        }
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(toggle_shortcut)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
