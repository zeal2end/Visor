# Quake Visor - Task Tracker

> **Legend:** ` ` = pending, `~` = in progress, `x` = done, `-` = cancelled

---

## Phase 1: Core Shell (MVP)

### Project Setup
- [ ] Initialize Tauri v2 project with React + TypeScript
- [ ] Configure Vite for Tauri
- [ ] Set up Tailwind CSS with Gruvbox theme
- [ ] Configure ESLint + Prettier
- [ ] Set up Zustand store structure

### Window Management
- [ ] Create frameless, transparent window
- [ ] Implement always-on-top behavior
- [ ] Register global hotkey (`Ctrl+~`)
- [ ] Implement show/hide with slide animation
- [ ] Handle multi-monitor positioning

### Layout & Components
- [ ] Build `WindowContainer` with three-zone grid
- [ ] Build `ZoneA` (Stream) component
- [ ] Build `ZoneB` (Reference) component
- [ ] Build `OmniInput` component with mode indicator
- [ ] Build `ModeIndicator` label component
- [ ] Implement ghost text placeholder

### Task Management
- [ ] Define Task data model
- [ ] Implement task creation from input
- [ ] Implement task completion toggle
- [ ] Implement task archiving
- [ ] Build `TaskList` component
- [ ] Build `TaskItem` component
- [ ] Persist tasks to `~/.visor/data.json`

### Parser
- [ ] Implement prefix tokenizer
- [ ] Route to task/command/search/log handlers
- [ ] Real-time mode detection as user types
- [ ] Handle edge cases (no space after prefix, empty input)

---

## Phase 2: Navigation & Polish

### Context Stack
- [ ] Implement project model
- [ ] Build `use <project>` command
- [ ] Implement context stack push/pop
- [ ] Auto-pop when project empties
- [ ] Show current context in header

### Vim Navigation
- [ ] Implement normal/insert mode toggle (ESC/i)
- [ ] Implement `j`/`k` task selection
- [ ] Implement `h`/`l` zone switching
- [ ] Implement `Space` to complete selected
- [ ] Implement `x` to archive selected
- [ ] Visual selection indicator

### Undo System
- [ ] Define `UndoAction` types
- [ ] Implement undo stack (max 20)
- [ ] Implement `Cmd+Z` / `u` triggers
- [ ] Implement redo with `Cmd+Shift+Z`
- [ ] Build toast with action window (5s countdown)

### Empty States
- [ ] Zone A empty state (all clear + hints)
- [ ] Zone B empty state (mini cheatsheet + recent searches)
- [ ] Search no results state
- [ ] First launch onboarding

### Settings
- [ ] Build `SettingsModal` component
- [ ] Implement settings categories (General, Appearance, Keybindings, etc.)
- [ ] Persist settings to `~/.visor/config.json`
- [ ] Apply theme changes in real-time
- [ ] Hotkey customization

---

## Phase 3: Integrations

### Logseq Bridge
- [ ] Implement `log:` command handler
- [ ] Find/create daily journal file
- [ ] Append timestamped bullet
- [ ] Atomic file write (temp → rename)
- [ ] Offline cache for failed writes
- [ ] Settings: graph path, journal format

### Focus Module
- [ ] Implement `focus <minutes>` command
- [ ] Build `FocusBar` progress component
- [ ] Color progression (green → yellow → red)
- [ ] Auto-open Visor on timer complete
- [ ] Play notification sound
- [ ] Track focus session history

### Library
- [ ] Implement cheatsheet storage (`~/.visor/library/cheatsheets/`)
- [ ] Build Fuse.js search index
- [ ] Implement `?` search command
- [ ] Display results in Zone B
- [ ] Implement template save/load
- [ ] Open in external editor command

### Command Palette
- [ ] Build `CommandPalette` overlay component
- [ ] Fuzzy search all commands
- [ ] Show command descriptions
- [ ] Execute on selection

---

## Phase 4: Distribution

### Cross-Platform
- [ ] Test on macOS (primary)
- [ ] Test on Windows
- [ ] Test on Linux (Ubuntu/Fedora)
- [ ] Fix platform-specific issues
- [ ] Handle hotkey conflicts per platform

### Build & Release
- [ ] Configure GitHub Actions CI/CD
- [ ] Set up code signing (macOS, Windows)
- [ ] Build `.dmg` for macOS
- [ ] Build `.msi` for Windows
- [ ] Build `.AppImage` for Linux
- [ ] Implement auto-updater

### Polish
- [ ] Performance profiling
- [ ] Memory usage optimization
- [ ] Startup time optimization (<500ms)
- [ ] Accessibility audit
- [ ] Error tracking setup

---

## Backlog (Future)

- [ ] Sync across devices (optional cloud)
- [ ] Plugin system for custom commands
- [ ] Calendar integration
- [ ] Clipboard history mode
- [ ] Quick calculator (`= 5 * 3`)
- [ ] AI assistant integration (`ask:` prefix)
- [ ] Habit tracking mode
- [ ] Time tracking for projects

---

## Completed

### Design Phase
- [x] Initial ideation (`_archive/ideation.md`)
- [x] Storyboard and scenarios (`_archive/storyboard.md`)
- [x] Design spec (`_archive/design_spec.md`)
- [x] Master plan / design bible (`MASTER_PLAN.md`)
- [x] Technical design document (`TECHNICAL_DESIGN.md`)
- [x] AI context document (`CLAUDE.md`)
- [x] Task tracking setup (`TODO.md`)
- [x] Git repository initialization

---

## Notes

### Priority Order
1. **Phase 1** is the critical path — validate the core interaction loop
2. **Phase 2** makes it usable as a daily driver
3. **Phase 3** adds differentiation
4. **Phase 4** enables distribution

### Success Criteria
- **Phase 1 Done:** Summon → add → complete → dismiss in <5s, keyboard only
- **Phase 2 Done:** Can manage multiple projects without mouse
- **Phase 3 Done:** Using Visor daily instead of other todo apps
- **Phase 4 Done:** Others can install and use it

---

*Last Updated: 2026-02-02*
