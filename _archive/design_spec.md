# Design Specification: "Visor"

> **Project:** Visor (The Terminal for Life)
> **Philosophy:** "Disney Strategy" Phase 2 - The Blueprint.
> **Goal:** A cohesive, aesthetic, and behavioral definition of the system before technical implementation.

---

## 1. Visual Identity ("Terminal Chic")

The application must feel like a native extension of a developer's environment—somewhere between `zsh` and a heads-up display (HUD).

### A. The Container
*   **Window Type:** Frameless, floating overlay.
*   **Material:** `NSVisualEffectMaterialPopover` (MacOS Native Blur/Vibrancy).
*   **Dimensions:**
    *   Width: 100% of screen.
    *   Height: 45% (expandable).
    *   Position: Top-anchored (slides down).
*   **Borders:** None. A subtle 1px bottom border (accent color) to separate it from the desktop.

### B. Typography & Color
*   **Font:** `JetBrains Mono` or `Fira Code` (Nerd Font patched).
*   **Base Theme:** **Gruvbox Dark Hard** (Warm, retro, low eye strain).
    *   Background: `#1d2021` (90% opacity).
    *   Foreground: `#ebdbb2`.
    *   Accent (Focus): `#d79921` (Yellow/Gold).
    *   Accent (Success): `#98971a` (Green).
    *   Accent (Error): `#cc241d` (Red).
*   **UI Elements:**
    *   **Focus Ring:** No rounded corners. Hard edges. Thick borders indicating selection.
    *   **Progress Bars:** ASCII-style or block characters (`████░░`).

---

## 2. Information Architecture

### The Two-Pane Grid
The screen is vertically split (configurable ratio, default 60/40).

| **Zone** | **Content** | **Behavior** |
| :--- | :--- | :--- |
| **Zone A: The Stream (Left)** | The Active Context (Todos/Tasks). | Vertical list. Items flow **Bottom-Up** (newest/active closest to input). Indentation indicates subtasks. |
| **Zone B: The Reference (Right)** | Information/Vault/Cheatsheets. | Static content. Search results. Project Lists. "Help" text. |
| **Zone C: The Bridge (Bottom)** | The Omni-Input & Status Bar. | The single point of interaction. Always focused when window opens. |

---

## 3. Interaction Design (The "Game Loop")

### A. The "Context Stack" (Navigation)
The user traverses "depth" rather than "tabs."

1.  **State: Root (`~`)**
    *   User sees "General" todos.
    *   Status Bar: `~`
2.  **Action: Focus Project**
    *   Command: `use shop`
    *   Animation: The General list slides *left*, the Shop list slides in from *right*.
    *   Status Bar: `~/shop`
3.  **Action: Completion**
    *   User completes all tasks in `shop`.
    *   Animation: A subtle "flash" of the border (Green).
    *   Transition: The Shop list slides *right* (away), the General list slides back in from *left*.
    *   Status Bar: `~`

### B. The Omni-Input (Smart Parsing)
The input field is "Context Aware." It detects intent based on the first character or keywords.

*   **Mode: Task Entry (Default)**
    *   Input: `buy milk` -> Adds to current project.
    *   Input: `shop: buy milk` -> Adds to `shop` project (even if not focused).
*   **Mode: Command (`/` or `>`)**
    *   Input: `> focus 25` -> Starts timer.
    *   Input: `> reload` -> Reloads app config.
*   **Mode: Log (`log:`)**
    *   Input: `log: idea for app` -> Appends to Logseq journal.
    *   *Visual Feedback:* Input text turns blue/dim to indicate "passthrough."
*   **Mode: Search (`?`)**
    *   Input: `? docker` -> Searches Cheatsheets/Snippets. Results appear in **Zone B**.

### C. Vim-Like Navigation
*   **Normal Mode (ESC):**
    *   `h`/`l`: Toggle focus between Zone A and Zone B.
    *   `j`/`k`: Move selection highlight.
    *   `TAB`: Cycle subtask indentation (Indent/Outdent).
    *   `x`: Archive task.
    *   `Space`: Toggle status.
*   **Insert Mode (i/a):**
    *   Focus returns to Zone C (Input).

---

## 4. Feature Specifications

### A. The "Brain Dump" (Logseq Bridge)
*   **Logic:**
    *   User configures `LOGSEQ_GRAPH_PATH`.
    *   System calculates `YYYY_MM_DD.md`.
    *   Appends `\n- [Timestamp] {Content}` to the file.
*   **Failure State:** If file is locked/missing, cache locally and retry. Show "Offline" indicator.

### B. The Focus Module (Pomodoro)
*   **Visual:** A thin 2px line at the very top of the window.
    *   Green -> Yellow -> Red as time depletes.
*   **State:** When timer hits 0:
    *   Window forcibly opens (if closed).
    *   Play sound (configurable).
    *   Show "Break Time" ASCII art in Zone B.

### C. Templating System
*   **Storage:** `~/.visor/templates/*.json`
*   **Interaction:**
    *   `save as trip_packing` -> Serializes current list to JSON.
    *   `load trip_packing` -> Appends items to current list.
    *   `edit template trip_packing` -> Spawns `code ~/.visor/templates/trip_packing.json`.

---

## 5. Feedback & Micro-Interactions
*   **Toast Notifications:** Small, transient overlays in the bottom-right for system messages ("Copied to Clipboard", "Saved to Logseq").
*   **Sound:** Minimal "Click" sound on task completion (Optional).
*   **Error States:** Input border turns Red if command is invalid.
