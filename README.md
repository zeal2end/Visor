# Visor V2 (Quake Visor)

[![Documentation](https://img.shields.io/badge/docs-live-brightgreen)](https://zeal2end.github.io/Visor/)

A keyboard-centric, Quake-style task manager for macOS (and other desktops) built with Tauri, React, and Rust. It stays hidden until you summon it with a global shortcut (`Ctrl + ~`), allowing you to quickly capture tasks, manage projects, and run focus sessions without breaking your flow.

## ✨ Features

*   **Quake-Style Visor**: Toggles a top-of-screen overlay with a global shortcut (`Ctrl + ~`).
*   **Keyboard-Driven Navigation**: Vim-like bindings (`h`/`j`/`k`/`l`) to browse projects, tasks, and threads.
*   **Seamless Input**:
    *   `i` to add tasks.
    *   `Shift + Enter` to add subtasks.
    *   `>` for command mode (rename projects, change colors).
    *   `?` for fuzzy search.
    *   `:` for journal entries.
*   **Task Power-Ups**:
    *   **Recurrence**: `!every day`, `!every week`, `!every mon`.
    *   **Due Dates**: `!today`, `!tomorrow`, `!friday`.
    *   **Scheduling**: `@tomorrow` (start date).
    *   **Notes**: Attach rich text notes to any task (`n` key).
*   **Focus Timer**: Built-in Pomodoro-style timer with system notifications.
*   **Local First**: All data stored locally in `~/.visor/data.json`.
*   **HTTP API**: Local server (`http://127.0.0.1:8745`) for external integrations.

## 🚀 Installation

### Prerequisites

*   **Node.js** (v18+)
*   **Rust** (latest stable) & Cargo
*   **macOS** (primary support) or Linux/Windows (may require additional setup).

### Build from Source

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/quake-visor.git
    cd quake-visor
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    cd src
    npm install
    ```

3.  **Run in Development Mode**:
    ```bash
    npm run tauri dev
    ```

4.  **Build for Production**:
    ```bash
    npm run tauri build
    ```
    The executable will be in `src-tauri/target/release/bundle/`.

## 📖 Usage Guide

### Global Shortcut
*   **Toggle Visor**: `Ctrl + ~\ (Control + Backtick)

### Navigation (Vim-style)
| Key | Action |
| :--- | :--- |
| `j` / `k` | Move selection down / up |
| `h` | Go back / Pop view stack |
| `l` / `Enter` | Enter project / Open task details |
| `Space` | Toggle task completion |
| `x` | Archive task |
| `u` | Undo |
| `Shift + Cmd + z` | Redo |

### Task Management
| Key | Action |
| :--- | :--- |
| `i` | Add new task (Input mode) |
| `Shift + Enter` | Add subtask to selected task |
| `e` | Edit selected task / Project settings |
| `n` | Edit notes for selected task |
| `Alt + Up/Down` | Reorder task |

### Commands & Modes
*   **Command Mode (`>`)**:
    *   `> rename <slug> <new_name>`: Rename a project.
    *   `> color <slug> <hex_code>`: Change project color.
    *   `> delete <slug>`: Delete a project.
    *   `> template save`: Save current view as a template.
    *   `> template apply`: Apply a saved template.
*   **Search Mode (`?`)**: Fuzzy search all active tasks.
*   **Journal Mode (`:`)**: Quick log entry.

### Smart Task Syntax
When adding/editing tasks, you can use natural language tags:
*   **Deadlines**: `Buy milk !today`, `Report !friday`, `Tax !2025/04/15`
*   **Schedule**: `Start draft @tomorrow`
*   **Recurrence**: `Standup !every weekday`, `Review !every friday`, `Rent !every month`

## ⚙️ Configuration & Data

*   **Data Storage**: `~/.visor/data.json` (JSON format, easy to backup).
*   **API Server**: Listens on `http://127.0.0.1:8745`.
    *   `GET /api/status`: System stats.
    *   `GET /api/tasks`: List tasks.
    *   `POST /api/tasks`: Create task (`{ "content": "...", "project": "slug" }`).

## 🛠 Architecture

*   **Frontend**: React 19, TypeScript, Zustand (State), Fuse.js.
*   **Backend**: Rust (Tauri 2.0), tiny_http, notify-rust.
*   **Design**: Single-zone "View Stack" architecture. Pushing a project/thread adds a layer; popping removes it.

## 🤝 Contributing

1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## 📄 License

MIT License. See [LICENSE](LICENSE) file for details.
