# VISOR: TECHNICAL DESIGN DOCUMENT

> **Status:** Technical Specification
> **Audience:** Developers implementing Visor
> **Companion:** See `MASTER_PLAN.md` for UX and interaction design

---

## 1. Technology Stack

### Core Framework
| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Desktop Runtime** | Tauri v2 (Rust) | Lightweight (~5MB vs Electron's 150MB+), native performance, secure IPC |
| **Frontend** | React 18 + TypeScript | Component model, ecosystem, type safety |
| **Bundler** | Vite | Fast HMR, native ESM, Tauri integration |
| **State Management** | Zustand | Minimal boilerplate, fast updates, no context hell |
| **Styling** | Tailwind CSS | Utility-first, easy theming, small bundle |

### Supporting Libraries
| Purpose | Library | Notes |
| :--- | :--- | :--- |
| Markdown Rendering | `react-markdown` + `remark-gfm` | For cheatsheets and reference display |
| Keyboard Handling | `hotkeys-js` (frontend) | In-app shortcuts |
| Global Hotkeys | Tauri `global-shortcut` plugin | OS-level summon key |
| Date/Time | `date-fns` | Lightweight, tree-shakeable |
| Fuzzy Search | `fuse.js` | Command palette and library search |
| Sound | Tauri `notification` plugin | Timer completion alerts |

---

## 2. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TAURI SHELL                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    WEBVIEW (React)                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │   Zone A    │  │   Zone B    │  │   Settings      │   │  │
│  │  │  (Stream)   │  │ (Reference) │  │   (Modal)       │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              Zone C (Omni-Input)                    │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                          │                                │  │
│  │                    Zustand Store                          │  │
│  └──────────────────────────┼────────────────────────────────┘  │
│                             │ IPC (invoke/emit)                 │
│  ┌──────────────────────────┼────────────────────────────────┐  │
│  │                    RUST BACKEND                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │  Commands  │  │   State    │  │   Integrations     │  │  │
│  │  │  Handler   │  │  Manager   │  │   (Logseq, FS)     │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   File System     │
                    │  ~/.visor/        │
                    └───────────────────┘
```

### Layer Responsibilities

| Layer | Responsibilities |
| :--- | :--- |
| **Tauri Shell** | Window management, global shortcuts, system tray, OS integration |
| **React Frontend** | UI rendering, local state, user interactions, animations |
| **Zustand Store** | Application state, cross-component communication |
| **Rust Backend** | File I/O, data persistence, Logseq integration, heavy computation |

---

## 3. Data Models

### 3.1 Core Entities

#### Task
```typescript
interface Task {
  id: string;              // UUID v4
  content: string;         // Task text
  completed: boolean;
  archived: boolean;
  projectId: string;       // Reference to parent project
  parentId: string | null; // For subtasks (null = root level)
  indent: number;          // 0 = root, 1 = subtask, 2 = sub-subtask
  createdAt: number;       // Unix timestamp (ms)
  completedAt: number | null;
}
```

#### Project
```typescript
interface Project {
  id: string;              // UUID v4
  name: string;            // Display name
  slug: string;            // Lowercase, for commands (e.g., "shop")
  color: string;           // Hex color for visual distinction
  taskOrder: string[];     // Ordered task IDs (for manual sorting)
  createdAt: number;
  isInbox: boolean;        // True for the default Inbox project
}
```

#### Cheatsheet
```typescript
interface Cheatsheet {
  id: string;
  name: string;            // Display name
  slug: string;            // For search (e.g., "docker")
  content: string;         // Markdown content
  tags: string[];          // For search filtering
  createdAt: number;
  updatedAt: number;
}
```

#### Template
```typescript
interface Template {
  id: string;
  name: string;            // Display name (e.g., "Trip Packing")
  slug: string;            // For commands (e.g., "trip_packing")
  tasks: TemplateTask[];   // Task definitions
  createdAt: number;
}

interface TemplateTask {
  content: string;
  indent: number;
}
```

#### FocusSession
```typescript
interface FocusSession {
  id: string;
  duration: number;        // Duration in seconds
  startedAt: number;       // Unix timestamp (ms)
  completedAt: number | null;
  interrupted: boolean;
}
```

### 3.2 Application State

#### AppState (Zustand Root)
```typescript
interface AppState {
  // UI State
  isVisible: boolean;
  activeZone: 'A' | 'B';
  mode: 'insert' | 'normal';
  settingsOpen: boolean;

  // Context Navigation
  contextStack: string[];  // Stack of project IDs (last = current)
  currentProjectId: string;

  // Data
  projects: Record<string, Project>;
  tasks: Record<string, Task>;
  cheatsheets: Record<string, Cheatsheet>;
  templates: Record<string, Template>;

  // Focus Timer
  focusSession: FocusSession | null;

  // Undo System
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Search & Reference
  searchQuery: string;
  searchResults: SearchResult[];
  recentSearches: string[];

  // Input
  inputValue: string;
  inputMode: InputMode;

  // Settings
  settings: Settings;
}
```

#### UndoAction
```typescript
type UndoAction =
  | { type: 'COMPLETE_TASK'; taskId: string; previousState: boolean }
  | { type: 'ARCHIVE_TASK'; taskId: string; task: Task }
  | { type: 'DELETE_TASK'; taskId: string; task: Task }
  | { type: 'CREATE_TASK'; taskId: string }
  | { type: 'SWITCH_CONTEXT'; previousProjectId: string };
```

#### InputMode
```typescript
type InputMode =
  | { type: 'TASK'; targetProject: string }
  | { type: 'COMMAND'; command: string }
  | { type: 'SEARCH'; query: string }
  | { type: 'LOG'; content: string };
```

### 3.3 Settings Schema

```typescript
interface Settings {
  general: {
    globalHotkey: string;        // e.g., "CommandOrControl+`"
    launchAtLogin: boolean;
    showInMenuBar: boolean;
    defaultContext: 'inbox' | 'last-used';
    autoHideDelay: number | null; // seconds, null = never
  };
  appearance: {
    theme: 'gruvbox-dark' | 'gruvbox-light' | 'nord' | 'dracula' | 'custom';
    customTheme?: ThemeColors;
    fontFamily: string;
    fontSize: number;            // px
    windowOpacity: number;       // 0.7 - 1.0
    blurIntensity: 'none' | 'light' | 'heavy';
    windowWidth: number;         // percentage of screen
    windowHeight: number;        // percentage of screen
    animationSpeed: 'instant' | 'fast' | 'normal';
  };
  keybindings: Record<KeyAction, string>;
  integrations: {
    logseq: {
      enabled: boolean;
      graphPath: string;
      journalFormat: string;     // date-fns format
      timestampFormat: string;
    };
    externalEditor: {
      path: string;
      args: string[];
    };
    notifications: {
      sound: boolean;
      soundFile: string;
    };
  };
  data: {
    dataDirectory: string;
    autoSaveInterval: 'immediate' | '5s' | '30s' | '1min';
    backupFrequency: 'daily' | 'weekly' | 'never';
    undoHistorySize: number;
  };
}

type KeyAction =
  | 'summon' | 'normalMode' | 'insertMode'
  | 'navigateUp' | 'navigateDown' | 'panelLeft' | 'panelRight'
  | 'completeTask' | 'archiveTask' | 'undo' | 'redo' | 'commandPalette';
```

---

## 4. File System Structure

### Application Data Directory

```
~/.visor/
├── config.json           # Settings (schema above)
├── data.json             # Tasks, projects, focus sessions
├── library/
│   ├── cheatsheets/
│   │   ├── docker.md
│   │   ├── git.md
│   │   └── ...
│   └── templates/
│       ├── trip_packing.json
│       └── ...
├── backups/
│   ├── data_2026-02-01.json
│   └── ...
└── logs/
    └── visor.log         # Debug logs (when enabled)
```

### Data File Schema (`data.json`)

```typescript
interface DataFile {
  version: number;         // Schema version for migrations
  projects: Project[];
  tasks: Task[];
  focusHistory: FocusSession[];
  recentSearches: string[];
  lastContext: string;     // Project ID
}
```

---

## 5. Component Architecture

### 5.1 Component Tree

```
App
├── WindowContainer
│   ├── FocusBar                    # Pomodoro progress bar
│   ├── MainLayout
│   │   ├── ZoneA (Stream)
│   │   │   ├── ContextHeader       # Shows current project name
│   │   │   ├── TaskList
│   │   │   │   └── TaskItem[]
│   │   │   └── EmptyState
│   │   ├── ZoneDivider             # Resizable divider
│   │   └── ZoneB (Reference)
│   │       ├── SearchResults
│   │       ├── CheatsheetView
│   │       ├── ProjectList
│   │       └── EmptyState
│   ├── OmniInput
│   │   ├── ModeIndicator
│   │   ├── InputField
│   │   └── AutocompleteMenu
│   └── ToastContainer
│       └── Toast[]
├── SettingsModal
│   ├── SettingsSidebar
│   └── SettingsPanel
└── CommandPalette                   # Overlay when Cmd+P pressed
```

### 5.2 Key Component Specifications

#### OmniInput
| Prop | Type | Description |
| :--- | :--- | :--- |
| `value` | `string` | Controlled input value |
| `mode` | `InputMode` | Current parsed mode |
| `onSubmit` | `(value: string) => void` | Enter key handler |
| `onModeChange` | `(mode: InputMode) => void` | Real-time parse callback |

**Internal State:**
- `autocompleteOpen: boolean`
- `autocompleteIndex: number`
- `autocompleteItems: AutocompleteItem[]`

#### TaskItem
| Prop | Type | Description |
| :--- | :--- | :--- |
| `task` | `Task` | Task data |
| `isSelected` | `boolean` | Vim selection state |
| `onComplete` | `() => void` | Toggle completion |
| `onArchive` | `() => void` | Archive task |
| `indentLevel` | `number` | Visual nesting |

#### Toast
| Prop | Type | Description |
| :--- | :--- | :--- |
| `message` | `string` | Toast content |
| `type` | `'info' \| 'success' \| 'error' \| 'undo'` | Visual variant |
| `duration` | `number` | Auto-dismiss (ms) |
| `action` | `{ label: string, onClick: () => void }` | Optional undo button |

---

## 6. Command Parser Design

### 6.1 Parser Architecture

The Omni-Input parser uses a **prefix-based tokenizer** with fallback to default task mode.

```
Input String
     │
     ▼
┌─────────────┐
│  Tokenizer  │  Identifies prefix (>, ?, log:, project:)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Router    │  Routes to appropriate handler
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Command │ Search │ Log │ Task Handler  │
└─────────────────────────────────────────┘
```

### 6.2 Parse Rules (Priority Order)

| Priority | Pattern | Regex | Result |
| :--- | :--- | :--- | :--- |
| 1 | Command | `^[>/]\s*(.+)$` | `{ type: 'COMMAND', command: $1 }` |
| 2 | Search | `^\?\s*(.*)$` | `{ type: 'SEARCH', query: $1 }` |
| 3 | Log | `^log:\s*(.+)$` | `{ type: 'LOG', content: $1 }` |
| 4 | Project Task | `^(\w+):\s*(.+)$` | `{ type: 'TASK', project: $1, content: $2 }` |
| 5 | Default Task | `^(.+)$` | `{ type: 'TASK', project: current, content: $1 }` |

### 6.3 Command Registry

Commands are registered in a central registry with metadata for autocomplete.

```typescript
interface CommandDefinition {
  name: string;           // Primary name (e.g., "focus")
  aliases: string[];      // Alternative names (e.g., ["f", "pomodoro"])
  description: string;    // For help and autocomplete
  args: ArgDefinition[];  // Argument specifications
  handler: (args: ParsedArgs, ctx: CommandContext) => Promise<CommandResult>;
}

interface ArgDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  default?: any;
}
```

### 6.4 Built-in Commands

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `focus` | `[minutes=25]` | Start focus timer |
| `use` | `<project>` | Switch context |
| `new` | `<project>` | Create project |
| `archive` | `<project>` | Archive project |
| `load` | `<template>` | Load template tasks |
| `save` | `<name>` | Save current list as template |
| `help` | `[command]` | Show help |
| `settings` | — | Open settings |
| `undo` | — | Undo last action |
| `redo` | — | Redo last undone action |
| `clear` | — | Clear completed tasks |
| `export` | `[format]` | Export data |

---

## 7. IPC Layer (Frontend ↔ Backend)

### 7.1 Tauri Commands (Rust → Frontend invocable)

```rust
// Commands exposed to frontend via #[tauri::command]

// Data Persistence
fn load_data() -> Result<DataFile, Error>
fn save_data(data: DataFile) -> Result<(), Error>
fn load_settings() -> Result<Settings, Error>
fn save_settings(settings: Settings) -> Result<(), Error>

// Logseq Integration
fn append_to_logseq(content: String, settings: LogseqSettings) -> Result<(), Error>
fn get_logseq_status(path: String) -> Result<LogseqStatus, Error>

// File Operations
fn read_cheatsheet(slug: String) -> Result<String, Error>
fn write_cheatsheet(slug: String, content: String) -> Result<(), Error>
fn list_cheatsheets() -> Result<Vec<CheatsheetMeta>, Error>
fn open_in_editor(path: String, editor: EditorSettings) -> Result<(), Error>

// System
fn get_system_fonts() -> Result<Vec<String>, Error>
fn play_notification_sound(sound_file: String) -> Result<(), Error>
```

### 7.2 Tauri Events (Backend → Frontend)

| Event | Payload | Trigger |
| :--- | :--- | :--- |
| `visor://toggle` | — | Global hotkey pressed |
| `visor://focus-complete` | `{ sessionId: string }` | Timer finished |
| `visor://file-changed` | `{ path: string }` | External file modification |

### 7.3 Frontend Invoke Pattern

```typescript
// Type-safe invoke wrapper
async function invoke<T>(cmd: string, args?: object): Promise<T> {
  return await tauriInvoke<T>(cmd, args);
}

// Usage
const data = await invoke<DataFile>('load_data');
await invoke('save_data', { data: updatedData });
```

---

## 8. State Management Design

### 8.1 Zustand Store Structure

```typescript
// Separate slices for modularity
const useStore = create<AppState>()(
  devtools(
    persist(
      (...args) => ({
        ...createUISlice(...args),
        ...createTaskSlice(...args),
        ...createFocusSlice(...args),
        ...createUndoSlice(...args),
        ...createSearchSlice(...args),
        ...createSettingsSlice(...args),
      }),
      { name: 'visor-store' }
    )
  )
);
```

### 8.2 Slice Definitions

#### UI Slice
```typescript
interface UISlice {
  isVisible: boolean;
  activeZone: 'A' | 'B';
  mode: 'insert' | 'normal';
  selectedTaskIndex: number;
  settingsOpen: boolean;

  // Actions
  toggleVisibility: () => void;
  setActiveZone: (zone: 'A' | 'B') => void;
  setMode: (mode: 'insert' | 'normal') => void;
  moveSelection: (direction: 'up' | 'down') => void;
}
```

#### Task Slice
```typescript
interface TaskSlice {
  tasks: Record<string, Task>;
  projects: Record<string, Project>;
  currentProjectId: string;
  contextStack: string[];

  // Actions
  addTask: (content: string, projectId?: string) => void;
  completeTask: (taskId: string) => void;
  archiveTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  switchContext: (projectId: string) => void;
  popContext: () => void;
}
```

#### Undo Slice
```typescript
interface UndoSlice {
  undoStack: UndoAction[];
  redoStack: UndoAction[];

  // Actions
  pushUndo: (action: UndoAction) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}
```

### 8.3 State Persistence Strategy

| State Type | Persistence | Method |
| :--- | :--- | :--- |
| Tasks, Projects | Persistent | File (via Rust backend) |
| Settings | Persistent | File (via Rust backend) |
| UI State (visibility, mode) | Session | Memory only |
| Undo Stack | Session | Memory only |
| Context Stack | Session | Memory (restore last on launch) |
| Search Results | Ephemeral | Memory only |

### 8.4 Sync Strategy

```
User Action
     │
     ▼
┌─────────────┐
│ Zustand     │  Immediate update
│ Store       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Debounced   │  500ms debounce
│ Save Queue  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Rust        │  Atomic file write
│ Backend     │
└─────────────┘
```

---

## 9. Window Management

### 9.1 Window Configuration

```rust
// Tauri window configuration
WindowBuilder::new(app, "main")
    .title("Visor")
    .decorations(false)           // Frameless
    .transparent(true)            // For blur effect
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)               // Start hidden
    .inner_size(screen_width * 0.8, screen_height * 0.5)
    .position(centered_x, 0)      // Top of screen
```

### 9.2 Show/Hide Animation

| Phase | Duration | Easing | Property |
| :--- | :--- | :--- | :--- |
| Show | 150ms | `ease-out` | `translateY(-100%) → translateY(0)` |
| Hide | 100ms | `ease-in` | `translateY(0) → translateY(-100%)` |

### 9.3 Global Hotkey Registration

```rust
// Register global shortcut via Tauri plugin
app.global_shortcut()
    .register(settings.global_hotkey, move || {
        // Emit toggle event to frontend
        app.emit("visor://toggle", ()).unwrap();
    });
```

---

## 10. Integration Architectures

### 10.1 Logseq Bridge

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Frontend    │────▶│ Rust Backend │────▶│ Logseq Graph    │
│ log: text   │     │ append_to_   │     │ journals/       │
│             │     │ logseq()     │     │ YYYY_MM_DD.md   │
└─────────────┘     └──────────────┘     └─────────────────┘
```

**Write Algorithm:**
1. Construct journal path: `{graphPath}/journals/{date}.md`
2. Read existing content (or create empty)
3. Append bullet with timestamp: `- {HH:mm} {content}`
4. Write file atomically (write to temp, then rename)

**Error Handling:**
- Graph path invalid → Return error, show toast
- File locked → Retry 3x with 100ms delay
- Write failed → Cache locally, retry on next action

### 10.2 Library Search (Fuse.js)

```typescript
// Search index configuration
const fuseOptions = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'content', weight: 1 },
    { name: 'tags', weight: 1.5 }
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2
};

// Index built on startup, updated on cheatsheet changes
const searchIndex = new Fuse(cheatsheets, fuseOptions);
```

---

## 11. Performance Considerations

### 11.1 Targets

| Metric | Target | Measurement |
| :--- | :--- | :--- |
| Cold start | < 500ms | Time to first paint |
| Hotkey to visible | < 100ms | User-perceived latency |
| Input responsiveness | < 16ms | Keypress to render |
| Memory footprint | < 100MB | Resident set size |
| Bundle size | < 5MB | Installed application |

### 11.2 Optimization Strategies

**Frontend:**
- Virtualize task lists > 100 items (`react-window`)
- Memoize components with `React.memo`
- Debounce input parsing (50ms)
- Lazy load settings modal

**Backend:**
- Cache parsed cheatsheets in memory
- Debounce file writes (500ms)
- Use streaming for large file reads

**Window:**
- Keep window in memory (hide, don't destroy)
- Preload blur/transparency on startup

### 11.3 Startup Sequence

```
1. [0ms]     Tauri initializes
2. [50ms]    Load settings.json
3. [100ms]   Register global hotkey
4. [150ms]   Load data.json into memory
5. [200ms]   React app mounts (hidden)
6. [300ms]   Build search index
7. [400ms]   Ready for hotkey
```

---

## 12. Error Handling Strategy

### 12.1 Error Categories

| Category | Example | Handling |
| :--- | :--- | :--- |
| **User Error** | Invalid command syntax | Toast with suggestion |
| **Data Error** | Corrupted data.json | Restore from backup, notify |
| **Integration Error** | Logseq path missing | Toast with fix instructions |
| **System Error** | Disk full | Modal with recovery options |
| **Unexpected** | Panic/crash | Log, attempt recovery, report |

### 12.2 Error Display

```typescript
interface AppError {
  code: string;           // e.g., "LOGSEQ_PATH_INVALID"
  message: string;        // User-friendly message
  details?: string;       // Technical details (for debug mode)
  recoverable: boolean;
  suggestedAction?: string;
}
```

### 12.3 Recovery Mechanisms

| Scenario | Recovery |
| :--- | :--- |
| Data file corrupted | Load most recent backup |
| Data file missing | Initialize with defaults |
| Settings corrupted | Reset to defaults, notify user |
| Backup fails | Continue operation, log warning |
| Global hotkey conflict | Prompt user to change in settings |

---

## 13. Security Considerations

### 13.1 Tauri Security

- **CSP:** Strict Content Security Policy
- **IPC:** Allowlist only required commands
- **File Access:** Scope to `~/.visor/` and configured paths only
- **No Remote Content:** All assets bundled locally

### 13.2 Data Security

- **No Encryption at Rest:** User's responsibility (use encrypted volume if needed)
- **No Telemetry:** Zero data collection
- **Local Only:** No network requests (except future optional sync)

---

## 14. Testing Strategy

### 14.1 Test Layers

| Layer | Framework | Coverage Target |
| :--- | :--- | :--- |
| Unit (Rust) | `cargo test` | Backend logic, parser |
| Unit (TS) | Vitest | Utils, store slices |
| Component | React Testing Library | UI components |
| Integration | Playwright | E2E user flows |

### 14.2 Critical Test Paths

1. **Summon/Dismiss Cycle:** Hotkey → visible → hotkey → hidden
2. **Task CRUD:** Create → complete → undo → archive
3. **Context Navigation:** Use project → add tasks → pop context
4. **Command Parsing:** All prefix patterns correctly routed
5. **Persistence:** Data survives app restart
6. **Focus Timer:** Start → complete → notification

---

## 15. Build & Distribution

### 15.1 Build Targets

| Platform | Format | Signing |
| :--- | :--- | :--- |
| macOS | `.dmg`, `.app` | Apple Developer ID |
| Windows | `.msi`, `.exe` | Code signing cert |
| Linux | `.AppImage`, `.deb` | — |

### 15.2 CI/CD Pipeline

```
Push to main
     │
     ▼
┌─────────────┐
│  Lint &     │
│  Type Check │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Unit Tests │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Build      │  (all platforms)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  E2E Tests  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Release    │  (on tag)
└─────────────┘
```

---

## 16. Project Structure

```
visor/
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   ├── commands/            # IPC command handlers
│   │   │   ├── mod.rs
│   │   │   ├── data.rs          # Load/save data
│   │   │   ├── logseq.rs        # Logseq integration
│   │   │   └── system.rs        # System utilities
│   │   ├── state.rs             # App state management
│   │   └── window.rs            # Window management
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                          # React frontend
│   ├── components/
│   │   ├── layout/
│   │   │   ├── WindowContainer.tsx
│   │   │   ├── ZoneA.tsx
│   │   │   ├── ZoneB.tsx
│   │   │   └── OmniInput.tsx
│   │   ├── tasks/
│   │   │   ├── TaskList.tsx
│   │   │   └── TaskItem.tsx
│   │   ├── reference/
│   │   │   ├── SearchResults.tsx
│   │   │   └── CheatsheetView.tsx
│   │   ├── settings/
│   │   │   └── SettingsModal.tsx
│   │   └── common/
│   │       ├── Toast.tsx
│   │       └── EmptyState.tsx
│   ├── store/
│   │   ├── index.ts             # Root store
│   │   ├── slices/
│   │   │   ├── ui.ts
│   │   │   ├── tasks.ts
│   │   │   ├── focus.ts
│   │   │   ├── undo.ts
│   │   │   └── settings.ts
│   │   └── types.ts
│   ├── lib/
│   │   ├── parser.ts            # Command parser
│   │   ├── commands.ts          # Command registry
│   │   ├── search.ts            # Fuse.js wrapper
│   │   └── tauri.ts             # IPC helpers
│   ├── hooks/
│   │   ├── useKeyboard.ts
│   │   ├── useVimNavigation.ts
│   │   └── useFocusTimer.ts
│   ├── styles/
│   │   ├── themes/
│   │   │   ├── gruvbox-dark.css
│   │   │   └── ...
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   ├── components/
│   └── e2e/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

*Document Version: 1.0*
*Last Updated: 2026-02-02*
