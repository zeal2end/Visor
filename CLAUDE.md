# Claude Context - Quake Visor Project

## Project Gist

**Working Title:** Quake Visor / "Visor"

**Core Idea:** A Quake-style drop-down overlay for daily life — keyboard-first task management, quick reference lookup, and focus tools that appear instantly with a hotkey and disappear without breaking flow.

**Key Philosophy:** "If you reach for the mouse, the design has failed." — Eliminate context-switching friction by providing instant access without covering your workspace.

---

## The Big Concept: Terminal for Life

Instead of opening heavy apps (Notion, Obsidian, Todoist):

1. **Summon** = Single hotkey (`Ctrl+~`) drops down a semi-transparent overlay
2. **Omni-Input** = Smart input field that routes intent based on prefix (`>` command, `?` search, `log:` journal)
3. **Context Stack** = Navigate projects like directories (`use shop` → focus on shopping list)
4. **Vim Navigation** = `hjkl` movement, `Space` to complete, `x` to archive
5. **Instant Dismiss** = ESC or hotkey hides it — data persists, flow preserved

---

## Key Differentiators

- **Keyboard-first** (no mouse required for any operation)
- **Instant access** (<100ms hotkey to visible)
- **Lightweight** (Tauri ~5MB vs Electron 150MB+)
- **Smart input parsing** (one input field, multiple modes)
- **Logseq integration** (brain dump without opening the app)
- **Graceful UX** (undo system, empty states with hints, mode indicators)

---

## Architecture Overview

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Desktop Shell | Tauri v2 (Rust) | Window management, global hotkeys, file I/O |
| Frontend | React 18 + TypeScript | UI components, state, interactions |
| State | Zustand | Fast in-memory state management |
| Storage | JSON + Markdown | `~/.visor/` for data, settings, library |

**Three-Zone Layout:**
- **Zone A (Left):** The Stream — active tasks, flows bottom-up
- **Zone B (Right):** The Reference — search results, cheatsheets, help
- **Zone C (Bottom):** The Omni-Input — single smart input field

---

## Critical Challenges - STATUS

| # | Challenge | Status | Solution |
| :--- | :--- | :--- | :--- |
| 1 | Prefix memorization cognitive load | ✓ SOLVED | Mode indicator + ghost text hints + command palette (`Cmd+P`) |
| 2 | Accidental destructive actions | ✓ SOLVED | Undo stack (20 actions) + toast with 5s action window |
| 3 | Input ambiguity | ✓ SOLVED | Explicit parsing rules + real-time mode indicator |
| 4 | Empty states feel broken | ✓ SOLVED | Contextual hints, mini cheatsheet, recent searches |
| 5 | Cross-platform window behavior | PENDING | Tauri handles most; needs testing on Windows/Linux |
| 6 | Logseq integration brittleness | PENDING | Atomic writes + retry logic + offline cache |
| 7 | Global hotkey conflicts | PENDING | Customizable hotkey in settings |
| 8 | Performance on large task lists | PENDING | Virtualization (`react-window`) for 100+ items |

---

## Design Principles

### Core Tenets
1. **Flow state is sacred** — Every interaction minimizes disruption
2. **Keyboard-first** — Mouse is fallback, not primary
3. **Progressive disclosure** — Simple by default, powerful when needed
4. **Instant feedback** — Every action has visible response (<16ms)
5. **Reversible actions** — Undo everything, shame nothing

### UX Rules
- Empty states teach, never feel broken
- Mode indicator always shows what will happen on Enter
- Settings are accessible but not required to use the app
- Complex editing happens in external editor (VS Code)

---

## Current Status

- **Stage:** Phase 1 — Core Shell (in progress)
- **Documentation:**
  - `MASTER_PLAN.md` — UX and interaction design (the "what")
  - `TECHNICAL_DESIGN.md` — Architecture and implementation spec (the "how")
  - `_archive/` — Earlier ideation documents
- **Code:** Scaffold complete, global hotkey wired, slide animation, persistence
- **Branch:** `agent/phase1-core-shell`
- **What works:**
  - Tauri v2 frameless/transparent/always-on-top window
  - Global hotkey (`Ctrl+`\``) toggles show/hide via Rust backend
  - Slide-down/slide-up animation on toggle
  - Three-zone layout (Stream, Reference, OmniInput)
  - OmniInput with real-time mode parsing (TASK/CMD/SEARCH/LOG)
  - Zustand store with task CRUD, context stack, undo/redo
  - Vim-style keyboard navigation (hjkl, Space, x, u, ESC)
  - Persistence to `~/.visor/data.json`
- **What's next:** Test full flow with `npm run tauri dev`, polish OmniInput ghost text, command execution

---

## Project Structure

```
quake_visor/
├── CLAUDE.md              # This file (AI context)
├── MASTER_PLAN.md         # UX/Design spec
├── TECHNICAL_DESIGN.md    # Technical architecture
├── TODO.md                # Task tracking
├── _archive/              # Historical design docs
│   ├── ideation.md
│   ├── storyboard.md
│   └── design_spec.md
└── src/                   # (Future) Implementation
```

---

## Implementation Phases

### Phase 1: Core Shell (MVP)
- [ ] Tauri project setup with window management
- [ ] Global hotkey registration
- [ ] Show/hide animation (slide down)
- [ ] Three-zone layout (A, B, C)
- [ ] Omni-Input with mode indicator
- [ ] Basic task CRUD (add, complete, archive)

**Go/No-Go:** Can summon → add task → complete → dismiss in <5 seconds

### Phase 2: Navigation & Polish
- [ ] Context stack (use/pop projects)
- [ ] Vim-like navigation (`hjkl`, `Space`, `x`)
- [ ] Undo system with toast
- [ ] Empty states with hints
- [ ] Settings modal

**Go/No-Go:** Full keyboard workflow without mouse

### Phase 3: Integrations
- [ ] Logseq bridge (`log:` command)
- [ ] Focus module (Pomodoro timer)
- [ ] Library (cheatsheets + templates)
- [ ] Search with Fuse.js

**Go/No-Go:** Daily driver for personal use

### Phase 4: Distribution
- [ ] Cross-platform testing (macOS, Windows, Linux)
- [ ] Auto-update mechanism
- [ ] Signed builds
- [ ] Public release

---

## Quick Commands Reference

| Input | Action |
| :--- | :--- |
| `buy milk` | Add task to current context |
| `shop: eggs` | Add task to "shop" project |
| `> focus 25` | Start 25-min Pomodoro |
| `> use shop` | Switch to shopping context |
| `? docker` | Search library for "docker" |
| `log: feeling stuck` | Append to Logseq journal |
| `> settings` | Open settings modal |
| `> help` | Show command reference |

---

## Key Resources

- **UX Spec:** `MASTER_PLAN.md`
- **Tech Spec:** `TECHNICAL_DESIGN.md`
- **Inspiration:** Quake console, VS Code command palette, Raycast

---

## Development Commands

```bash
# (Future - once implementation starts)
cd /Users/drost/workspace/claude_projects/quake_visor

# Install dependencies
npm install

# Run development
npm run tauri dev

# Build for production
npm run tauri build
```

---

**Last Updated:** 2026-02-13
**Stage:** Phase 1 Core Shell — In Progress
