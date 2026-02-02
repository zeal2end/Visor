# VISOR: DESIGN BIBLE
> **Status:** Vision & Interaction Spec
> **Philosophy:** "The Terminal for Your Life"
> **Metaphor:** A Command Line Interface (CLI) for the operating system of your daily tasks.

---

## 1. Core Philosophy
Visor is designed to eliminate the friction of "Context Switching."
*   **Invisible until needed:** It lives in the "ceiling" of your OS.
*   **Instant:** A single keystroke summons it.
*   **Keyboard First:** If you have to reach for the mouse, the design has failed.
*   **Input Driven:** You don't "click buttons"; you "issue commands."

## 2. Visual Identity ("Terminal Chic")
The aesthetic sits between a raw Terminal (`zsh`) and a modern HUD (Head-Up Display).

*   **The Container:**
    *   A frameless, floating window.
    *   Slides down from the top (Quake-style).
    *   **Material:** Heavy blur (Glassmorphism) to blend with the desktop wallpaper.
*   **The Typography:** Monospace fonts (JetBrains Mono/Fira Code).
*   **The Theme:** High contrast, low eye strain (e.g., Gruvbox Dark).
    *   *Green/Gold* for active elements.
    *   *Dimmed Grey* for passive history.

---

## 3. The Interface (The Stage)

**Layout Strategy: The Split Terminal**
The window is divided into three distinct zones.

| **Zone** | **Purpose** | **Behavior** |
| :--- | :--- | :--- |
| **Zone A (Left)** | **The Stream** (Active Context) | Displays your current tasks. Items flow **Bottom-Up**, keeping the newest/most relevant items right above your input cursor. |
| **Zone B (Right)** | **The Reference** (Passive Info) | Displays static info: Search results, Cheatsheets, or the "Project List" when switching contexts. |
| **Zone C (Bottom)** | **The Omni-Input** | The single point of truth. A blinking cursor waiting for commands. |

---

## 4. Interaction Model

### A. The "Omni-Input"
The input field is smart. It acts as a router for your intent.
*   **Task Entry:** Typing normally adds a task to the active project.
    *   *Syntax:* `Project: Task` (Routes to specific project).
    *   *Syntax:* `Indent` (Creates sub-tasks).
*   **Command Mode:** Prefixed with `>` or `/`.
    *   *Example:* `> focus 25` (Starts timer).
*   **Log Mode:** Prefixed with `log:`.
    *   *Example:* `log: feeling stuck` (Bypasses Visor and writes to Logseq).
*   **Search Mode:** Prefixed with `?`.
    *   *Example:* `? docker` (Shows reference in Zone B).
*   **Palette Mode:** Prefixed with `Cmd+P` or `> `.
    *   Opens a fuzzy-searchable command palette (VS Code style).
    *   Alternative to memorizing prefixes — type partial command name to filter.

#### Mode Indicator & Input Hints
To reduce cognitive load of prefix memorization:
*   **Mode Indicator:** A small label to the left of input showing current parse interpretation.
    *   Updates in real-time as user types.
    *   Shows: `TASK`, `CMD`, `SEARCH`, `LOG`, `PROJECT:` based on detected prefix.
*   **Ghost Text Hint:** When input is empty, show subtle placeholder:
    *   `"task" | > command | ? search | log: journal`
*   **Real-time Interpretation:** As user types, the mode indicator confirms what will happen on Enter.
    *   Typing `>focus` → indicator shows `CMD` (parsed as command, missing space is tolerated).
    *   Typing `buy milk` → indicator shows `TASK → Inbox`.
    *   Typing `shop: eggs` → indicator shows `TASK → Shopping`.

#### Parsing Rules (Explicit)
| Input Pattern | Interpretation | Action |
| :--- | :--- | :--- |
| `> command` or `/command` | Command Mode | Execute system command |
| `? query` | Search Mode | Search library, show in Zone B |
| `log: text` | Log Mode | Append to Logseq daily journal |
| `project: task` | Targeted Task | Add task to specific project |
| `plain text` | Default Task | Add task to active context |
| `>text` (no space) | Command Mode | Tolerate missing space, parse as command |
| `?` (alone) | Search Mode | Show empty state with search hints |
| Multi-line paste | Multi-Task | Each line becomes separate task |

### B. The "Context Stack" (Navigation)
Visor behaves like a directory system (`cd`).
1.  **Root (`~`):** You start in your "Inbox" (General Todos).
2.  **Drill Down:** Command `use shop` focuses *only* on the Shopping list.
3.  **Auto-Return:** When the last item in "Shopping" is checked off, the system automatically "pops" the stack and returns you to Root (`~`).
    *   *Why?* It ensures you are never left staring at a blank screen.

### C. Vim-Like Navigation
*   **Normal Mode (ESC):** The input loses focus.
    *   `h` / `l`: Switch focus between Left (Stream) and Right (Reference) panels.
    *   `j` / `k`: Move up/down tasks.
    *   `x`: Delete/Archive.
    *   `Space`: Toggle Complete.
    *   `u`: Undo last action.
*   **Insert Mode (i):** Focus returns to the Omni-Input.

### D. Undo System
Destructive actions should be reversible to prevent accidental data loss.

*   **Undo Stack:** Maintains history of last 20 destructive actions.
*   **Supported Actions:**
    *   Task completion (`Space`) → Undo marks incomplete
    *   Task archive (`x`) → Undo restores to list
    *   Task deletion → Undo restores task
    *   Project switch → Undo returns to previous context
*   **Triggers:**
    *   `Cmd+Z` (global, works in any mode)
    *   `u` in Normal Mode
    *   `> undo` command
*   **Visual Feedback (Toast with Action Window):**
    *   On destructive action, show toast: `"Archived: buy milk" [Undo - 5s]`
    *   Toast persists for 5 seconds with clickable "Undo" or press `Cmd+Z`
    *   After timeout, toast fades and action is committed
*   **Stack Behavior:**
    *   Multiple undos traverse the stack (Cmd+Z, Cmd+Z, Cmd+Z...)
    *   `Cmd+Shift+Z` or `> redo` to redo

---

## 5. Feature Sets

### A. The Focus Module (Pomodoro)
*   **Visual:** A subtle "Life Bar" at the very top of the window.
*   **Behavior:** When the timer expires, the Visor **forcibly opens**. It interrupts you to say "Time's Up."

### B. The "Second Brain" Bridge (Logseq)
*   Visor is for *Short Term Memory* (RAM).
*   Logseq is for *Long Term Memory* (Hard Drive).
*   **Integration:** The `log:` command allows you to dump thoughts directly into your daily journal without opening the heavy Logseq app.

### C. The Library (Templates & Cheatsheets)
*   **Templates:** "Recurring Rituals" (e.g., Packing List) can be loaded instantly via command.
*   **Cheatsheets:** Personal "Man Pages" for commands/info you forget.
*   **Editing:** Complex edits happen in your external editor (VS Code), not inside Visor. Visor is for *reading* and *checking off*.

---

## 6. Empty States & Contextual Hints

Empty states should never feel broken or abandoned. Every empty zone provides value.

### Zone A (Stream) — No Tasks
When the active context has no tasks:
```
┌─────────────────────────────────┐
│                                 │
│      ✓ All clear in Inbox       │
│                                 │
│   Start typing to add a task    │
│   or `use project` to switch    │
│                                 │
└─────────────────────────────────┘
```
*   Show completion message with context name
*   Provide next action hints

### Zone B (Reference) — Nothing to Display
When no search/reference is active:
```
┌─────────────────────────────────┐
│  Quick Reference                │
│  ─────────────────              │
│  ? docker     Search library    │
│  > focus 25   Start timer       │
│  > help       Show all commands │
│                                 │
│  Recent Searches                │
│  ─────────────────              │
│  ? git rebase                   │
│  ? ssh tunnel                   │
│                                 │
└─────────────────────────────────┘
```
*   **Mini Cheatsheet:** Show 3-4 most useful commands
*   **Recent Searches:** Last 3-5 search queries (clickable to re-run)
*   **Contextual Tips:** Rotate tips based on usage patterns

### Zone B — Search with No Results
When `? query` returns nothing:
```
┌─────────────────────────────────┐
│  No results for "kubernetes"    │
│                                 │
│  Try:                           │
│  • Check spelling               │
│  • Use fewer keywords           │
│  • Add to library:              │
│    > new cheatsheet kubernetes  │
│                                 │
└─────────────────────────────────┘
```
*   Acknowledge the query
*   Provide actionable suggestions
*   Offer to create new entry

### Zone A — New User / First Launch
On first launch, Zone A shows onboarding:
```
┌─────────────────────────────────┐
│  Welcome to Visor               │
│  ─────────────────              │
│                                 │
│  Try these to get started:      │
│                                 │
│  1. Type "buy milk" + Enter     │
│     → Creates your first task   │
│                                 │
│  2. Press Space on a task       │
│     → Marks it complete         │
│                                 │
│  3. Type "> help" + Enter       │
│     → See all commands          │
│                                 │
│  Press any key to dismiss...    │
└─────────────────────────────────┘
```

---

## 7. Settings & Configuration

Visor settings are accessed via `> settings` command or `Cmd+,`.

### Settings Panel Layout
Opens as a modal overlay (not a separate window). Maintains the terminal aesthetic.

```
┌─────────────────────────────────────────────────────────────┐
│  VISOR SETTINGS                                    [ESC]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ▸ General                                                  │
│    Appearance                                               │
│    Keybindings                                              │
│    Integrations                                             │
│    Data & Storage                                           │
│    Advanced                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### General Settings
| Setting | Options | Default |
| :--- | :--- | :--- |
| **Global Hotkey** | Customizable key combo | `Ctrl + ~` |
| **Launch at Login** | On / Off | Off |
| **Show in Menu Bar** | On / Off | On |
| **Default Context** | Inbox / Last Used | Inbox |
| **Auto-hide Delay** | 0s - 30s / Never | Never |

### Appearance Settings
| Setting | Options | Default |
| :--- | :--- | :--- |
| **Theme** | Gruvbox Dark / Gruvbox Light / Nord / Dracula / Custom | Gruvbox Dark |
| **Font Family** | System fonts list | JetBrains Mono |
| **Font Size** | 10px - 24px | 14px |
| **Window Opacity** | 70% - 100% | 90% |
| **Blur Intensity** | None / Light / Heavy | Heavy |
| **Window Width** | 50% - 100% screen | 80% |
| **Window Height** | 30% - 80% screen | 50% |
| **Animation Speed** | Instant / Fast / Normal | Fast |

### Keybindings Settings
Vim-style keybindings are customizable:
| Action | Default | Customizable |
| :--- | :--- | :--- |
| Summon Visor | `Ctrl + ~` | ✓ |
| Normal Mode | `ESC` | ✓ |
| Insert Mode | `i` | ✓ |
| Navigate Up | `k` | ✓ |
| Navigate Down | `j` | ✓ |
| Panel Left | `h` | ✓ |
| Panel Right | `l` | ✓ |
| Complete Task | `Space` | ✓ |
| Archive Task | `x` | ✓ |
| Undo | `u` / `Cmd+Z` | ✓ |
| Command Palette | `Cmd+P` | ✓ |

### Integrations Settings
| Integration | Settings |
| :--- | :--- |
| **Logseq** | Graph Path: `~/Documents/logseq-graph/` <br> Journal Format: `YYYY_MM_DD.md` <br> Timestamp Format: `HH:mm` |
| **External Editor** | Path: `/usr/local/bin/code` <br> Args: `--new-window` |
| **Calendar** | Source: System Calendar / Google / None |
| **Notifications** | Sound: On / Off <br> Sound File: `default.wav` |

### Data & Storage Settings
| Setting | Options | Default |
| :--- | :--- | :--- |
| **Data Directory** | Path picker | `~/.visor/` |
| **Auto-save Interval** | 5s / 30s / 1min / On Change | On Change |
| **Backup Frequency** | Daily / Weekly / Never | Daily |
| **Export Format** | JSON / Markdown | JSON |
| **Undo History Size** | 10 - 100 actions | 20 |

### Advanced Settings
| Setting | Options | Default |
| :--- | :--- | :--- |
| **Debug Mode** | On / Off | Off |
| **Log Level** | Error / Warn / Info / Debug | Error |
| **Reset to Defaults** | Button | — |
| **Export Settings** | Button | — |
| **Import Settings** | Button | — |

### Settings File Location
Settings persist to `~/.visor/config.json`:
```json
{
  "general": {
    "globalHotkey": "Ctrl+`",
    "launchAtLogin": false,
    "defaultContext": "inbox"
  },
  "appearance": {
    "theme": "gruvbox-dark",
    "fontFamily": "JetBrains Mono",
    "fontSize": 14,
    "windowOpacity": 0.9
  },
  "keybindings": {
    "summon": "Ctrl+`",
    "normalMode": "Escape",
    "completeTask": "Space"
  },
  "integrations": {
    "logseq": {
      "graphPath": "~/Documents/logseq-graph/",
      "journalFormat": "YYYY_MM_DD.md"
    }
  }
}
```

---

## 8. Next Steps

### Implementation Phases
1. **Phase 1 — Core Shell**
   - Window management (summon/dismiss, always-on-top)
   - Omni-Input with mode indicator and parsing
   - Zone A/B/C layout with empty states

2. **Phase 2 — Task Management**
   - Task CRUD with undo system
   - Context stack navigation
   - Vim-like keybindings

3. **Phase 3 — Integrations**
   - Logseq bridge
   - Focus module (Pomodoro)
   - Library (templates & cheatsheets)

4. **Phase 4 — Polish**
   - Settings panel
   - Onboarding flow
   - Performance optimization

---

*Document Version: 2.0*
*Last Updated: 2026-02-02*
