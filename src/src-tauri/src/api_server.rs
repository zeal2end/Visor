use std::fs;
use std::thread;

use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

fn data_path() -> std::path::PathBuf {
    let home = dirs::home_dir().expect("Could not find home directory");
    home.join(".visor")
}

fn load_json() -> Value {
    let path = data_path().join("data.json");
    if path.exists() {
        let raw = fs::read_to_string(&path).unwrap_or_else(|_| "{}".to_string());
        serde_json::from_str(&raw).unwrap_or(json!({}))
    } else {
        json!({})
    }
}

fn save_json(data: &Value) {
    let dir = data_path();
    let _ = fs::create_dir_all(&dir);
    let _ = fs::write(dir.join("data.json"), serde_json::to_string_pretty(data).unwrap_or_default());
}

fn cors_headers() -> Vec<tiny_http::Header> {
    vec![
        "Access-Control-Allow-Origin: *".parse().unwrap(),
        "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS".parse().unwrap(),
        "Access-Control-Allow-Headers: Content-Type".parse().unwrap(),
        "Content-Type: application/json".parse().unwrap(),
    ]
}

fn respond_json(request: tiny_http::Request, status: u16, body: &Value) {
    let body_str = serde_json::to_string(body).unwrap_or_default();
    let status_code = tiny_http::StatusCode(status);
    let response = tiny_http::Response::from_string(body_str)
        .with_status_code(status_code)
        .with_header("Access-Control-Allow-Origin: *".parse::<tiny_http::Header>().unwrap())
        .with_header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS".parse::<tiny_http::Header>().unwrap())
        .with_header("Access-Control-Allow-Headers: Content-Type".parse::<tiny_http::Header>().unwrap())
        .with_header("Content-Type: application/json".parse::<tiny_http::Header>().unwrap());
    let _ = request.respond(response);
}

fn read_body(request: &mut tiny_http::Request) -> Value {
    let mut body = String::new();
    let _ = request.as_reader().read_to_string(&mut body);
    serde_json::from_str(&body).unwrap_or(json!({}))
}

pub fn start_api_server(app_handle: AppHandle) {
    thread::spawn(move || {
        let server = match tiny_http::Server::http("127.0.0.1:8745") {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Failed to start API server: {}", e);
                return;
            }
        };

        println!("Visor API server listening on http://127.0.0.1:8745");

        for mut request in server.incoming_requests() {
            let method = request.method().to_string();
            let url = request.url().to_string();

            // Handle CORS preflight
            if method == "OPTIONS" {
                let response = tiny_http::Response::from_string("")
                    .with_status_code(tiny_http::StatusCode(204));
                let mut resp = response;
                for header in cors_headers() {
                    resp = resp.with_header(header);
                }
                let _ = request.respond(resp);
                continue;
            }

            // Parse path and query
            let (path, query_string) = if let Some(idx) = url.find('?') {
                (&url[..idx], &url[idx + 1..])
            } else {
                (url.as_str(), "")
            };

            match (method.as_str(), path) {
                // GET /api/status
                ("GET", "/api/status") => {
                    let data = load_json();
                    let tasks = data.get("tasks").cloned().unwrap_or(json!({}));
                    let projects = data.get("projects").cloned().unwrap_or(json!({}));

                    let task_count = tasks.as_object().map_or(0, |t| t.len());
                    let project_count = projects.as_object().map_or(0, |p| p.len());
                    let pending = tasks.as_object().map_or(0, |t| {
                        t.values().filter(|v| {
                            !v.get("archived").and_then(|a| a.as_bool()).unwrap_or(false)
                                && !v.get("completed").and_then(|c| c.as_bool()).unwrap_or(false)
                        }).count()
                    });

                    respond_json(request, 200, &json!({
                        "tasks": task_count,
                        "projects": project_count,
                        "pending": pending
                    }));
                }

                // GET /api/projects
                ("GET", "/api/projects") => {
                    let data = load_json();
                    let projects = data.get("projects").cloned().unwrap_or(json!({}));
                    let list: Vec<Value> = projects.as_object()
                        .map(|p| p.values().cloned().collect())
                        .unwrap_or_default();
                    respond_json(request, 200, &json!(list));
                }

                // POST /api/projects
                ("POST", "/api/projects") => {
                    let body = read_body(&mut request);
                    let name = body.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string();
                    let slug = body.get("slug").and_then(|s| s.as_str()).unwrap_or("").to_string();

                    if name.is_empty() || slug.is_empty() {
                        respond_json(request, 400, &json!({"error": "name and slug required"}));
                        continue;
                    }

                    let mut data = load_json();
                    let id = uuid::Uuid::new_v4().to_string();
                    let project = json!({
                        "id": id,
                        "name": name,
                        "slug": slug,
                        "color": "#83a598",
                        "taskOrder": [],
                        "createdAt": chrono::Utc::now().timestamp_millis(),
                        "isInbox": false
                    });

                    if data.get("projects").is_none() {
                        data["projects"] = json!({});
                    }
                    data["projects"][&id] = project.clone();
                    save_json(&data);
                    let _ = app_handle.emit("data-changed", ());
                    respond_json(request, 201, &project);
                }

                // GET /api/tasks
                ("GET", "/api/tasks") => {
                    let data = load_json();
                    let tasks = data.get("tasks").cloned().unwrap_or(json!({}));

                    // Parse query params
                    let params: Vec<(&str, &str)> = query_string.split('&')
                        .filter(|s| !s.is_empty())
                        .filter_map(|s| s.split_once('='))
                        .collect();

                    let filter_project = params.iter().find(|(k, _)| *k == "project").map(|(_, v)| *v);
                    let filter_status = params.iter().find(|(k, _)| *k == "status").map(|(_, v)| *v);

                    let projects = data.get("projects").cloned().unwrap_or(json!({}));

                    let list: Vec<Value> = tasks.as_object()
                        .map(|t| {
                            t.values()
                                .filter(|task| {
                                    // Filter by project slug
                                    if let Some(slug) = filter_project {
                                        let project_id = task.get("projectId").and_then(|p| p.as_str()).unwrap_or("");
                                        let project_slug = projects.get(project_id)
                                            .and_then(|p| p.get("slug"))
                                            .and_then(|s| s.as_str())
                                            .unwrap_or("");
                                        if project_slug != slug {
                                            return false;
                                        }
                                    }
                                    // Filter by status
                                    if let Some(status) = filter_status {
                                        match status {
                                            "pending" => {
                                                let archived = task.get("archived").and_then(|a| a.as_bool()).unwrap_or(false);
                                                let completed = task.get("completed").and_then(|c| c.as_bool()).unwrap_or(false);
                                                if archived || completed {
                                                    return false;
                                                }
                                            }
                                            other => {
                                                let task_status = task.get("status").and_then(|s| s.as_str()).unwrap_or("TODO");
                                                if task_status != other.to_uppercase() {
                                                    return false;
                                                }
                                            }
                                        }
                                    }
                                    true
                                })
                                .cloned()
                                .collect()
                        })
                        .unwrap_or_default();

                    respond_json(request, 200, &json!(list));
                }

                // POST /api/tasks
                ("POST", "/api/tasks") => {
                    let body = read_body(&mut request);
                    let content = body.get("content").and_then(|c| c.as_str()).unwrap_or("").to_string();
                    let project_slug = body.get("project").and_then(|p| p.as_str()).unwrap_or("inbox").to_string();

                    if content.is_empty() {
                        respond_json(request, 400, &json!({"error": "content required"}));
                        continue;
                    }

                    let mut data = load_json();
                    let projects = data.get("projects").cloned().unwrap_or(json!({}));

                    // Find project by slug
                    let (project_id, _) = projects.as_object()
                        .and_then(|p| {
                            p.iter().find(|(_, v)| {
                                v.get("slug").and_then(|s| s.as_str()) == Some(&project_slug)
                            })
                        })
                        .map(|(k, v)| (k.clone(), v.clone()))
                        .unwrap_or_else(|| ("inbox".to_string(), json!({})));

                    let task_id = uuid::Uuid::new_v4().to_string();
                    let now = chrono::Utc::now().timestamp_millis();
                    let task = json!({
                        "id": task_id,
                        "content": content,
                        "completed": false,
                        "status": "TODO",
                        "archived": false,
                        "projectId": project_id,
                        "parentId": null,
                        "indent": 0,
                        "createdAt": now,
                        "completedAt": null,
                        "dueAt": null,
                        "scheduled": null,
                        "notes": null,
                        "recurrence": null
                    });

                    if data.get("tasks").is_none() {
                        data["tasks"] = json!({});
                    }
                    data["tasks"][&task_id] = task.clone();

                    // Add to project taskOrder
                    if let Some(proj) = data["projects"].get_mut(&project_id) {
                        if let Some(order) = proj.get_mut("taskOrder") {
                            if let Some(arr) = order.as_array_mut() {
                                arr.push(json!(task_id));
                            }
                        }
                    }

                    save_json(&data);
                    let _ = app_handle.emit("data-changed", ());
                    respond_json(request, 201, &task);
                }

                // PUT /api/tasks/:id/complete
                _ if method == "PUT" && path.starts_with("/api/tasks/") && path.ends_with("/complete") => {
                    let task_id = path.trim_start_matches("/api/tasks/").trim_end_matches("/complete");
                    let mut data = load_json();

                    if let Some(task) = data.get_mut("tasks").and_then(|t| t.get_mut(task_id)) {
                        task["status"] = json!("DONE");
                        task["completed"] = json!(true);
                        task["completedAt"] = json!(chrono::Utc::now().timestamp_millis());
                        let updated = task.clone();
                        save_json(&data);
                        let _ = app_handle.emit("data-changed", ());
                        respond_json(request, 200, &updated);
                    } else {
                        respond_json(request, 404, &json!({"error": "task not found"}));
                    }
                }

                // PUT /api/tasks/:id/archive
                _ if method == "PUT" && path.starts_with("/api/tasks/") && path.ends_with("/archive") => {
                    let task_id = path.trim_start_matches("/api/tasks/").trim_end_matches("/archive");
                    let mut data = load_json();

                    if let Some(task) = data.get_mut("tasks").and_then(|t| t.get_mut(task_id)) {
                        task["archived"] = json!(true);
                        let updated = task.clone();
                        save_json(&data);
                        let _ = app_handle.emit("data-changed", ());
                        respond_json(request, 200, &updated);
                    } else {
                        respond_json(request, 404, &json!({"error": "task not found"}));
                    }
                }

                // GET /api/log
                ("GET", "/api/log") => {
                    let data = load_json();
                    let log = data.get("logEntries").cloned().unwrap_or(json!([]));
                    respond_json(request, 200, &log);
                }

                // POST /api/log
                ("POST", "/api/log") => {
                    let body = read_body(&mut request);
                    let content = body.get("content").and_then(|c| c.as_str()).unwrap_or("").to_string();
                    let project_slug = body.get("project").and_then(|p| p.as_str()).unwrap_or("inbox").to_string();

                    if content.is_empty() {
                        respond_json(request, 400, &json!({"error": "content required"}));
                        continue;
                    }

                    let mut data = load_json();
                    let projects = data.get("projects").cloned().unwrap_or(json!({}));
                    let project_id = projects.as_object()
                        .and_then(|p| {
                            p.iter().find(|(_, v)| {
                                v.get("slug").and_then(|s| s.as_str()) == Some(&project_slug)
                            })
                        })
                        .map(|(k, _)| k.clone())
                        .unwrap_or_else(|| "inbox".to_string());

                    let entry = json!({
                        "id": uuid::Uuid::new_v4().to_string(),
                        "content": content,
                        "createdAt": chrono::Utc::now().timestamp_millis(),
                        "projectId": project_id
                    });

                    if data.get("logEntries").is_none() {
                        data["logEntries"] = json!([]);
                    }
                    if let Some(arr) = data["logEntries"].as_array_mut() {
                        arr.push(entry.clone());
                    }

                    save_json(&data);
                    let _ = app_handle.emit("data-changed", ());
                    respond_json(request, 201, &entry);
                }

                // 404
                _ => {
                    respond_json(request, 404, &json!({"error": "not found"}));
                }
            }
        }
    });
}
