// Type definitions for Visor V2

export interface LogEntry {
    id: string;
    content: string;
    createdAt: number;
    projectId: string;
}

export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'CANCELLED' | 'WAITING';

export const TASK_STATUS_ORDER: TaskStatus[] = ['TODO', 'DOING', 'DONE', 'CANCELLED', 'WAITING'];

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; icon: string; color: string }> = {
    TODO: { label: 'TODO', icon: '\u25CB', color: 'var(--fg4)' },
    DOING: { label: 'DOING', icon: '\u25D0', color: 'var(--blue)' },
    DONE: { label: 'DONE', icon: '\u25CF', color: 'var(--green)' },
    CANCELLED: { label: 'CANCELLED', icon: '\u2715', color: 'var(--red)' },
    WAITING: { label: 'WAITING', icon: '\u25CC', color: 'var(--yellow)' },
};

export interface Recurrence {
    type: 'daily' | 'weekly' | 'monthly' | 'weekdays';
    dayOfWeek?: number; // 0=Sun..6=Sat for weekly
}

export interface Task {
    id: string;
    content: string;
    completed: boolean; // kept for backward compat, derived from status
    status: TaskStatus;
    archived: boolean;
    projectId: string;
    parentId: string | null;
    indent: number;
    createdAt: number;
    completedAt: number | null;
    dueAt: number | null;
    scheduled: number | null;
    notes: string | null;
    recurrence: Recurrence | null;
}

export interface Project {
    id: string;
    name: string;
    slug: string;
    color: string;
    taskOrder: string[];
    createdAt: number;
    isInbox: boolean;
}

// V2 View stack navigation
export type ViewEntry =
    | { type: 'home' }
    | { type: 'agenda' }
    | { type: 'project'; projectId: string }
    | { type: 'thread'; projectId: string; parentTaskId: string }
    | { type: 'templates' }
    | { type: 'journal'; projectId: string }
    | { type: 'help' }
    | { type: 'search'; query: string }
    | { type: 'detail'; taskId: string }
    | { type: 'project-settings'; projectId: string };

// V2 Input overlay purpose
export type InputPurpose = 'task' | 'command' | 'search' | 'journal' | 'edit' | 'notes';

// V2 Template
export interface Template {
    id: string;
    name: string;
    tasks: Array<{ content: string; indent: number }>;
    createdAt: number;
}

// V2 Focus timer
export interface FocusTimer {
    minutes: number;
    startedAt: number;
    remaining: number;
    taskId?: string;
}

// Input mode parsing (kept for OmniInput compat)
export type InputMode =
    | { type: 'TASK'; targetProject: string | null }
    | { type: 'COMMAND'; command: string }
    | { type: 'SEARCH'; query: string }
    | { type: 'LOG'; content: string };

export type UndoAction =
    | { type: 'COMPLETE_TASK'; taskId: string; previousState: boolean }
    | { type: 'ARCHIVE_TASK'; taskId: string; task: Task }
    | { type: 'DELETE_TASK'; taskId: string; task: Task }
    | { type: 'CREATE_TASK'; taskId: string }
    | { type: 'STATUS_CHANGE'; taskId: string; previousStatus: TaskStatus };

export interface Toast {
    message: string;
    timestamp: number;
}

export interface Settings {
    general: { showWelcome: boolean };
    keybindings: { toggleVisor: string };
}

export const DEFAULT_SETTINGS: Settings = {
    general: { showWelcome: true },
    keybindings: { toggleVisor: 'alt+space' },
};

// Default Inbox project
export const INBOX_PROJECT: Project = {
    id: 'inbox',
    name: 'Inbox',
    slug: 'inbox',
    color: '#d79921',
    taskOrder: [],
    createdAt: Date.now(),
    isInbox: true,
};
