# Project Storyboard: "Visor" (Revision 3 - The Connected Terminal)

> **Philosophy:** "The Terminal for Your Life."
> **Core Pivot:** A keyboard-centric "Command Center" for tasks, knowledge, and focus.
> **Integrations:** Deep links to **Logseq** for long-term memory.
> **Aesthetics:** "Modern Retro" (Gruvbox/Dracula), Terminal-based but with rich UI (Autocomplete, Animations).

## 1. The Screenplay (Refined)

### Scene 1: The Summoning & The "Smart Input"
*   **Visual:** The Visor slides down (Glassmorphism/Blur).
*   **The Omni-Input:**
    *   As you type, an **Autocomplete Menu** floats *above* the cursor (like VS Code IntelliSense or Logseq `[[` menu).
    *   *Example:* User types `log`, menu suggests `[Cmd] log: (Brain Dump to Logseq)`.
    *   *Example:* User types `che`, menu suggests `[Cmd] cheat: (Search Cheatsheets)`.

### Scene 2: The "Brain Dump" (Logseq Integration)
*   **User Action:** Types `log: The auth API is returning 401 again.`
*   **System Action:**
    1.  Locates the local Logseq Graph (configured path).
    2.  Finds (or creates) today's journal file (e.g., `journals/2023_10_27.md`).
    3.  Appends a new bullet: `- The auth API is returning 401 again.`
*   **Result:** Thoughts are instantly captured in your "Second Brain" without opening the heavy app.

### Scene 3: The "Library" (Cheatsheets & Templates)
*   **CRUD Interactions:**
    *   **Create Template:** `template save [name]` -> Saves the *currently visible* todo list as a blueprint.
    *   **Load Template:** `load [name]` -> Instantly populates the active project with the saved items.
    *   **Read Cheatsheet:** `? docker` -> Opens the Right Panel with your Docker commands.
    *   **Edit Complex Data:** `edit template [name]` or `edit cheat [name]` -> **Opens the file in your System Default Editor** (e.g., VS Code).
        *   *Why?* Keeps the Visor light. Complex editing belongs in a complex editor.

### Scene 4: The "Focus Mode" (Pomodoro)
*   **Command:** `focus 25` (or `focus "Fix Bug" 25`)
*   **Visual:**
    *   A subtle, colored progress bar appears at the very top of the window (like a battery meter).
    *   The "Info Panel" shows `FOCUS: 14m left`.
*   **Alarm:** When time is up, the Visor slides down automatically with a notification sound/visual.

---

## 2. The Stage (UI Layout)

**Theme:** "Terminal Chic"
*   **Font:** JetBrains Mono or Fira Code (Nerd Fonts).
*   **Colors:** Customizable (Default: Gruvbox Dark Hard).
*   **Feedback:** "Toast" notifications for actions (e.g., "Saved to Logseq").

**Two-Panel Grid:**

| **Left Panel: Action (Todos)** | **Right Panel: Reference (Variable)** |
| :--- | :--- |
| **Project: @Work** | **Mode: CHEATSHEET (Docker)** |
| `[ ] Fix login bug` | `> prune: docker system prune -f` |
| `  [ ] Check token` (Subtask) | `> logs: docker logs -f <id>` |
| `[ ] Email Sarah` | |
| *Status: 2 Pending* | *Press [Enter] to copy* |

---

## 3. Data & Architecture

**Storage Strategy:**
*   **App State:** `~/.visor/data.json` (Projects, Todos, Settings).
*   **Library:** `~/.visor/library/`
    *   `templates/` (JSON/MD files for lists).
    *   `cheatsheets/` (MD files for snippets).
*   **Logseq Bridge:** Direct file system write to user's Logseq directory.

**Technical Stack (Final):**
*   **Core:** Tauri v2 (Rust).
*   **Frontend:** React + TypeScript.
*   **State:** Zustand (for in-memory speed).
*   **Styling:** Tailwind CSS (with `typography` plugin for Markdown rendering).
*   **Input:** Custom "Omni-Box" component with regex parsing for commands.

---

## 4. Next Steps (Planning Phase)
1.  **Component Architecture:** Define the React component hierarchy (`TerminalLayout`, `OmniInput`, `Panel`).
2.  **Command Registry:** Define the regex patterns for the parser (e.g., `^log:\s(.*)`).
3.  **File System Spec:** Define the exact JSON structure for robust saving/loading.

