# Ideation: Quake-Style Information Visor

## 1. Core Concept
**Working Title:** "MindVisor" / "DropDeck" / "QuickSpace"
**The Metaphor:** Just as the Quake console allows a gamer to drop down a command line to tweak the game engine without leaving the game, this tool allows a developer/creator to drop down their "Context Engine" without leaving their current task.

**The Problem:**
- **Context Switching Tax:** Opening Notion/Obsidian takes seconds and covers the screen.
- **Volatile Thoughts:** "I need to remember to check that API key" vanishes if not written down instantly.
- **Reference Friction:** Copy-pasting a port number or color code requires finding the file where it lives.

**The Solution:**
A "Quake-style" overlay window (Visor) that:
1.  Resides in the background.
2.  Appears instantly (Global Hotkey).
3.  Floats above all other windows.
4.  Dismisses instantly (`Esc` or Hotkey).

---

## 2. Usage Scenarios ("A Day in the Life")

### Scenario A: The "Flow State" Interruption
*   **Context:** You are coding deep in a Python backend.
*   **Trigger:** A thought pops up: "I need to buy milk" or "Update the README with this new env var".
*   **Action:**
    1.  Hit `Ctrl + ~`. The Visor slides down from the top (30% height).
    2.  Type "Buy milk" into the *Quick Entry* field.
    3.  Hit `Enter`.
    4.  Hit `Ctrl + ~`. Visor disappears.
*   **Result:** You never left your code editor. Flow maintained.

### Scenario B: The "Reference" Lookup
*   **Context:** You are configuring a deployment file. You need the staging database URL.
*   **Trigger:** You know you saved it in your "Snippets".
*   **Action:**
    1.  Hit `Ctrl + ~`.
    2.  Type `cmd + f` (or use built-in search) -> "staging db".
    3.  Copy the value.
    4.  Dismiss.
*   **Result:** No searching through Slack or 1Password.

### Scenario C: The "Morning Briefing"
*   **Context:** You start your computer.
*   **Action:** Open Visor.
*   **View:** A pinned "Daily Goals" list and a "Scratchpad" from yesterday.
*   **Result:** Instant orientation.

---

## 3. Functional Requirements

### Essential (MVP)
1.  **Global Hotkey Toggle:** Reliable show/hide logic.
2.  **Always on Top:** Must overlay VS Code/Browser.
3.  **Persistence:** Data saved to local JSON/Markdown files (obsidian-compatible?).
4.  **Three Panes:**
    *   **Todos:** Simple checkbox list.
    *   **Scratchpad:** Free-form Markdown editor.
    *   **Snippets:** Key-Value store for frequently used text.

### Nice-to-Have (Phase 2)
1.  **Obsidian Sync:** Read/Write directly to a specific folder in the Obsidian vault (`/obsidian/Whocares/QuickNotes`).
2.  **Terminal Integration:** An actual embedded terminal tab (zsh/fish) alongside the notes.
3.  **Command Palette:** `> Create new Jira ticket` (Integration hooks).

---

## 4. Technical Architecture Strategy

Given the user's stack (React/Vite) and the need for system-level window management:

### Option A: Tauri (Rust + React) - **RECOMMENDED**
*   **Pros:** Extremely lightweight (vs Electron), secure, easy global shortcuts via Rust backend.
*   **Cons:** Window management (transparency/blur) can be tricky on different OS versions.
*   **Stack:** Rust (Backend), React + TypeScript (Frontend), Tailwind (UI).

### Option B: Electron
*   **Pros:** Mature ecosystem for "Visor" behavior (many libraries), full Node.js access.
*   **Cons:** Heavier RAM usage (might feel sluggish for a "light" tool).

### Option C: Native macOS (Swift)
*   **Pros:** Perfect performance, native blur materials.
*   **Cons:** High learning curve, not cross-platform.

### Data Storage Strategy
To maintain the "Obsidian" philosophy:
*   Store data as **Markdown files** on the disk.
*   This allows the user to view their "Visor" notes inside their main knowledge base later.

---

## 5. Next Steps (Planning Phase)
1.  **Select Tech Stack:** Confirm Tauri vs Electron.
2.  **Define UI Layout:** Wireframe the 3-pane view.
3.  **Prototype Window Logic:** Build the "Hello World" that slides up/down.
