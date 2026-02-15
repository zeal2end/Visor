import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
    Task,
    TaskStatus,
    TASK_STATUS_ORDER,
    LogEntry,
    Project,
    InputMode,
    InputPurpose,
    UndoAction,
    ViewEntry,
    Template,
    FocusTimer,
    Toast,
    Settings,
    DEFAULT_SETTINGS,
    INBOX_PROJECT
} from './types';
import { CommandDef, filterCommands } from '../lib/commands';
import { parseDueDate } from '../lib/parser';

interface VisorStore {
    // Data
    tasks: Record<string, Task>;
    projects: Record<string, Project>;
    logEntries: LogEntry[];
    templates: Template[];
    settings: Settings;
    dataLoaded: boolean;

    // View stack navigation
    viewStack: ViewEntry[];
    lastNavDirection: 'push' | 'pop';
    selectedItemIndex: number;

    // Input overlay
    inputVisible: boolean;
    inputPurpose: InputPurpose;
    inputValue: string;
    inputMode: InputMode;
    editingTaskId: string | null;
    nextIndentLevel: number;

    // Suggestions
    suggestState: {
        suggestions: CommandDef[];
        selectedIndex: number;
        isOpen: boolean;
    };

    // Undo/Redo
    undoStack: UndoAction[];
    redoStack: UndoAction[];

    // Toast
    toast: Toast | null;

    // Focus
    focusTimer: FocusTimer | null;

    // UI
    settingsOpen: boolean;
    isVisible: boolean;

    // --- Navigation Actions ---
    pushView: (entry: ViewEntry) => void;
    popView: () => void;
    getCurrentView: () => ViewEntry;
    getCurrentProjectId: () => string;

    // --- Input Actions ---
    showInput: (purpose: InputPurpose, prefill?: string) => void;
    hideInput: () => void;
    setInputValue: (value: string) => void;
    setInputMode: (mode: InputMode) => void;
    setNextIndentLevel: (level: number) => void;

    // --- Suggest Actions ---
    updateSuggestions: (query: string) => void;
    closeSuggestions: () => void;

    // --- Selection ---
    moveSelection: (direction: 'up' | 'down') => void;
    getViewItems: () => Array<{ type: 'project'; data: Project } | { type: 'task'; data: Task } | { type: 'template'; data: Template }>;

    // --- Task Actions ---
    addTask: (content: string, projectId?: string) => void;
    completeTask: (taskId: string) => void;
    cycleTaskStatus: (taskId: string) => void;
    archiveTask: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
    updateTask: (taskId: string, updates: Partial<Pick<Task, 'content' | 'dueAt' | 'scheduled' | 'notes' | 'status'>>) => void;
    moveTaskOrder: (taskId: string, direction: 'up' | 'down') => void;
    getProjectTasks: (projectId: string, parentId?: string | null) => Task[];
    getAgendaTasks: () => { doing: Task[]; overdue: Task[]; today: Task[]; thisWeek: Task[]; upcoming: Task[] };
    navigateToTask: (taskId: string) => void;

    // --- Journal ---
    addLogEntry: (content: string) => void;

    // --- Commands ---
    executeCommand: (command: string) => void;
    searchTasks: (query: string) => void;

    // --- Focus ---
    startFocus: (minutes: number, taskId?: string) => void;
    stopFocus: () => void;
    tickFocus: () => void;

    // --- Templates ---
    saveTemplate: (name: string) => void;
    applyTemplate: (templateId: string) => void;
    deleteTemplate: (templateId: string) => void;

    // --- Project ---
    deleteProject: (projectSlug: string) => void;
    getProjectList: () => Project[];
    getProjectStats: () => { project: Project; total: number; pending: number; completed: number; progress: number }[];

    // --- Undo ---
    undo: () => void;
    redo: () => void;
    pushUndo: (action: UndoAction) => void;

    // --- Toast ---
    showToast: (message: string) => void;
    clearToast: () => void;

    // --- Settings ---
    toggleSettings: () => void;
    updateSettings: (partial: Partial<Settings>) => void;

    // --- Visibility ---
    toggleVisibility: () => void;
}

export const useStore = create<VisorStore>((set, get) => ({
    // --- Initial State ---
    tasks: {},
    projects: { [INBOX_PROJECT.id]: INBOX_PROJECT },
    logEntries: [],
    templates: [],
    settings: DEFAULT_SETTINGS,
    dataLoaded: false,

    viewStack: [{ type: 'home' }],
    lastNavDirection: 'push',
    selectedItemIndex: 0,

    inputVisible: false,
    inputPurpose: 'task',
    inputValue: '',
    inputMode: { type: 'TASK', targetProject: null },
    editingTaskId: null,
    nextIndentLevel: 0,

    suggestState: { suggestions: [], selectedIndex: 0, isOpen: false },

    undoStack: [],
    redoStack: [],

    toast: null,
    focusTimer: null,
    settingsOpen: false,
    isVisible: true,

    // --- Navigation ---
    pushView: (entry) => set(state => ({
        viewStack: [...state.viewStack, entry],
        selectedItemIndex: 0,
        lastNavDirection: 'push',
    })),

    popView: () => set(state => {
        if (state.viewStack.length <= 1) return state;
        return {
            viewStack: state.viewStack.slice(0, -1),
            selectedItemIndex: 0,
            lastNavDirection: 'pop',
        };
    }),

    getCurrentView: () => {
        const stack = get().viewStack;
        return stack[stack.length - 1];
    },

    getCurrentProjectId: () => {
        const stack = get().viewStack;
        for (let i = stack.length - 1; i >= 0; i--) {
            const v = stack[i];
            if (v.type === 'project') return v.projectId;
            if (v.type === 'thread') return v.projectId;
            if (v.type === 'journal') return v.projectId;
        }
        return 'inbox';
    },

    // --- Input ---
    showInput: (purpose, prefill) => set({
        inputVisible: true,
        inputPurpose: purpose,
        inputValue: prefill || '',
        inputMode: purpose === 'command'
            ? { type: 'COMMAND', command: '' }
            : purpose === 'search'
                ? { type: 'SEARCH', query: '' }
                : purpose === 'journal'
                    ? { type: 'LOG', content: '' }
                    : { type: 'TASK', targetProject: null },
    }),

    hideInput: () => set({
        inputVisible: false,
        inputValue: '',
        editingTaskId: null,
        nextIndentLevel: 0,
        suggestState: { suggestions: [], selectedIndex: 0, isOpen: false },
    }),

    setInputValue: (value) => set({ inputValue: value }),
    setNextIndentLevel: (level) => set({ nextIndentLevel: level }),

    setInputMode: (mode) => set({ inputMode: mode }),

    // --- Suggestions ---
    updateSuggestions: (query) => {
        const suggestions = filterCommands(query);
        set({ suggestState: { suggestions, selectedIndex: 0, isOpen: suggestions.length > 0 && query.length > 0 } });
    },

    closeSuggestions: () => set({ suggestState: { suggestions: [], selectedIndex: 0, isOpen: false } }),

    // --- Selection ---
    moveSelection: (direction) => set(state => {
        const items = get().getViewItems();
        const max = items.length - 1;
        if (max < 0) return state;
        let idx = state.selectedItemIndex;
        if (direction === 'down') idx = Math.min(max, idx + 1);
        else idx = Math.max(0, idx - 1);
        return { selectedItemIndex: idx };
    }),

    getViewItems: () => {
        const state = get();
        const view = state.getCurrentView();
        switch (view.type) {
            case 'home': {
                // Home: doing tasks + overdue + today + projects
                const agenda = get().getAgendaTasks();
                const items: Array<{ type: 'task'; data: Task } | { type: 'project'; data: Project }> = [];
                for (const t of agenda.doing) items.push({ type: 'task', data: t });
                for (const t of agenda.overdue) items.push({ type: 'task', data: t });
                for (const t of agenda.today) items.push({ type: 'task', data: t });
                const projects = get().getProjectList();
                for (const p of projects) items.push({ type: 'project', data: p });
                return items;
            }
            case 'agenda': {
                const agenda = get().getAgendaTasks();
                const items: Array<{ type: 'task'; data: Task }> = [];
                for (const t of agenda.doing) items.push({ type: 'task', data: t });
                for (const t of agenda.overdue) items.push({ type: 'task', data: t });
                for (const t of agenda.today) items.push({ type: 'task', data: t });
                for (const t of agenda.thisWeek) items.push({ type: 'task', data: t });
                for (const t of agenda.upcoming) items.push({ type: 'task', data: t });
                return items;
            }
            case 'project': {
                const tasks = get().getProjectTasks(view.projectId, null);
                return tasks.map(t => ({ type: 'task' as const, data: t }));
            }
            case 'thread': {
                const tasks = get().getProjectTasks(view.projectId, view.parentTaskId);
                return tasks.map(t => ({ type: 'task' as const, data: t }));
            }
            case 'templates': {
                return state.templates.map(t => ({ type: 'template' as const, data: t }));
            }
            case 'search': {
                const q = view.query.toLowerCase();
                const results = Object.values(state.tasks)
                    .filter(t => !t.archived && t.content.toLowerCase().includes(q))
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 30);
                return results.map(t => ({ type: 'task' as const, data: t }));
            }
            default:
                return [];
        }
    },

    // --- Task Actions ---
    addTask: (content, projectSlugOrId) => {
        const state = get();
        let targetProjectId = state.getCurrentProjectId();

        if (projectSlugOrId) {
            if (state.projects[projectSlugOrId]) {
                targetProjectId = projectSlugOrId;
            } else {
                const existing = Object.values(state.projects).find(p => p.slug === projectSlugOrId);
                if (existing) {
                    targetProjectId = existing.id;
                } else {
                    const newProject: Project = {
                        id: uuidv4(),
                        name: projectSlugOrId.charAt(0).toUpperCase() + projectSlugOrId.slice(1),
                        slug: projectSlugOrId.toLowerCase(),
                        color: '#58a6ff',
                        taskOrder: [],
                        createdAt: Date.now(),
                        isInbox: false,
                    };
                    set(s => ({ projects: { ...s.projects, [newProject.id]: newProject } }));
                    targetProjectId = newProject.id;
                    get().showToast(`Created project "${newProject.name}"`);
                }
            }
        }

        const id = uuidv4();
        const { content: cleanContent, dueAt, scheduled } = parseDueDate(content);
        const indent = state.nextIndentLevel;

        // Find parent based on view context
        let parentId: string | null = null;
        const view = state.getCurrentView();
        if (view.type === 'thread') {
            parentId = view.parentTaskId;
        } else if (indent > 0) {
            const project = state.projects[targetProjectId];
            if (project) {
                for (let i = project.taskOrder.length - 1; i >= 0; i--) {
                    const t = state.tasks[project.taskOrder[i]];
                    if (t && !t.archived && t.indent === indent - 1) {
                        parentId = t.id;
                        break;
                    }
                }
            }
        }

        const newTask: Task = {
            id,
            content: cleanContent,
            completed: false,
            status: 'TODO',
            archived: false,
            projectId: targetProjectId,
            parentId,
            indent: view.type === 'thread' ? 1 : indent,
            createdAt: Date.now(),
            completedAt: null,
            dueAt,
            scheduled,
            notes: null,
        };

        set(s => {
            const project = s.projects[targetProjectId];
            if (!project) return s;
            return {
                tasks: { ...s.tasks, [id]: newTask },
                projects: {
                    ...s.projects,
                    [targetProjectId]: {
                        ...project,
                        taskOrder: [...project.taskOrder, id],
                    },
                },
                inputValue: '',
                nextIndentLevel: 0,
                undoStack: [...s.undoStack.slice(-19), { type: 'CREATE_TASK', taskId: id }],
                redoStack: [],
            };
        });
    },

    completeTask: (taskId) => set(state => {
        const task = state.tasks[taskId];
        if (!task) return state;

        const previousState = task.completed;
        const newCompleted = !task.completed;
        const newStatus: TaskStatus = newCompleted ? 'DONE' : 'TODO';

        return {
            tasks: {
                ...state.tasks,
                [taskId]: {
                    ...task,
                    completed: newCompleted,
                    status: newStatus,
                    completedAt: newCompleted ? Date.now() : null,
                },
            },
            undoStack: [...state.undoStack.slice(-19), { type: 'COMPLETE_TASK', taskId, previousState }],
            redoStack: [],
        };
    }),

    cycleTaskStatus: (taskId) => set(state => {
        const task = state.tasks[taskId];
        if (!task) return state;

        const previousStatus = task.status || 'TODO';
        const currentIndex = TASK_STATUS_ORDER.indexOf(previousStatus);
        const nextIndex = (currentIndex + 1) % TASK_STATUS_ORDER.length;
        const newStatus = TASK_STATUS_ORDER[nextIndex];
        const isCompleted = newStatus === 'DONE';
        const isCancelled = newStatus === 'CANCELLED';

        return {
            tasks: {
                ...state.tasks,
                [taskId]: {
                    ...task,
                    status: newStatus,
                    completed: isCompleted || isCancelled,
                    completedAt: isCompleted ? Date.now() : task.completedAt,
                },
            },
            undoStack: [...state.undoStack.slice(-19), { type: 'STATUS_CHANGE', taskId, previousStatus }],
            redoStack: [],
        };
    }),

    archiveTask: (taskId) => set(state => {
        const task = state.tasks[taskId];
        if (!task) return state;

        return {
            tasks: { ...state.tasks, [taskId]: { ...task, archived: true } },
            undoStack: [...state.undoStack.slice(-19), { type: 'ARCHIVE_TASK', taskId, task }],
            redoStack: [],
        };
    }),

    deleteTask: (taskId) => set(state => {
        const task = state.tasks[taskId];
        if (!task) return state;

        const { [taskId]: _, ...remainingTasks } = state.tasks;
        const project = state.projects[task.projectId];
        const newTaskOrder = project.taskOrder.filter(id => id !== taskId);

        return {
            tasks: remainingTasks,
            projects: {
                ...state.projects,
                [task.projectId]: { ...project, taskOrder: newTaskOrder },
            },
            undoStack: [...state.undoStack.slice(-19), { type: 'DELETE_TASK', taskId, task }],
            redoStack: [],
        };
    }),

    updateTask: (taskId, updates) => set(state => {
        const task = state.tasks[taskId];
        if (!task) return state;

        const updatedTask = { ...task, ...updates };
        if (updates.status) {
            updatedTask.completed = updates.status === 'DONE' || updates.status === 'CANCELLED';
            if (updates.status === 'DONE') updatedTask.completedAt = Date.now();
        }

        return { tasks: { ...state.tasks, [taskId]: updatedTask } };
    }),

    moveTaskOrder: (taskId, direction) => set(state => {
        const task = state.tasks[taskId];
        if (!task) return state;

        const project = state.projects[task.projectId];
        if (!project) return state;

        const order = [...project.taskOrder];
        const idx = order.indexOf(taskId);
        if (idx === -1) return state;

        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= order.length) return state;

        [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];

        return {
            projects: {
                ...state.projects,
                [task.projectId]: { ...project, taskOrder: order },
            },
        };
    }),

    getProjectTasks: (projectId, parentId) => {
        const state = get();
        const project = state.projects[projectId];
        if (!project) return [];

        return project.taskOrder
            .map(id => state.tasks[id])
            .filter(task => {
                if (!task || task.archived) return false;
                if (parentId === undefined) return true;
                return task.parentId === parentId;
            });
    },

    getAgendaTasks: () => {
        const state = get();
        const now = Date.now();
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(23, 59, 59, 999);

        const allTasks = Object.values(state.tasks).filter(t => !t.archived && !t.completed);

        const doing = allTasks.filter(t => t.status === 'DOING');
        const overdue = allTasks.filter(t => t.dueAt && t.dueAt < now && t.status !== 'DOING').sort((a, b) => a.dueAt! - b.dueAt!);
        const today = allTasks.filter(t => t.dueAt && t.dueAt >= now && t.dueAt <= todayEnd.getTime() && t.status !== 'DOING').sort((a, b) => a.dueAt! - b.dueAt!);
        const thisWeek = allTasks.filter(t => t.dueAt && t.dueAt > todayEnd.getTime() && t.dueAt <= weekEnd.getTime()).sort((a, b) => a.dueAt! - b.dueAt!);
        const upcoming = allTasks.filter(t => t.dueAt && t.dueAt > weekEnd.getTime()).sort((a, b) => a.dueAt! - b.dueAt!).slice(0, 10);

        return { doing, overdue, today, thisWeek, upcoming };
    },

    navigateToTask: (taskId) => {
        const state = get();
        const task = state.tasks[taskId];
        if (!task) return;

        const project = state.projects[task.projectId];
        if (!project) return;

        // Build path: home → project → (thread chain) → select task
        const newStack: ViewEntry[] = [{ type: 'home' }, { type: 'project', projectId: project.id }];

        // If task has a parent, build thread chain
        if (task.parentId) {
            const chain: string[] = [];
            let current: string | null = task.parentId;
            while (current) {
                chain.unshift(current);
                const parent = state.tasks[current] as Task | undefined;
                current = parent?.parentId || null;
            }
            for (const parentTaskId of chain) {
                newStack.push({ type: 'thread', projectId: project.id, parentTaskId });
            }
        }

        // Find index of task in its view
        const lastView = newStack[newStack.length - 1];
        let selectedIndex = 0;
        if (lastView.type === 'project') {
            const tasks = get().getProjectTasks(project.id, null);
            selectedIndex = tasks.findIndex(t => t.id === taskId);
        } else if (lastView.type === 'thread') {
            const tasks = get().getProjectTasks(project.id, (lastView as any).parentTaskId);
            selectedIndex = tasks.findIndex(t => t.id === taskId);
        }

        set({
            viewStack: newStack,
            selectedItemIndex: Math.max(0, selectedIndex),
            lastNavDirection: 'push',
        });
    },

    // --- Journal ---
    addLogEntry: (content) => {
        const projectId = get().getCurrentProjectId();
        const entry: LogEntry = {
            id: uuidv4(),
            content,
            createdAt: Date.now(),
            projectId,
        };
        set(state => ({
            logEntries: [...state.logEntries, entry],
            inputValue: '',
        }));
    },

    // --- Commands ---
    executeCommand: (command) => {
        const parts = command.trim().split(/\s+/);
        const cmd = parts[0]?.toLowerCase();
        const args = parts.slice(1);

        switch (cmd) {
            case 'home':
                set({ viewStack: [{ type: 'home' }], selectedItemIndex: 0, lastNavDirection: 'push' });
                break;
            case 'agenda':
                get().pushView({ type: 'agenda' });
                break;
            case 'help':
                get().pushView({ type: 'help' });
                break;
            case 'templates':
                get().pushView({ type: 'templates' });
                break;
            case 'template': {
                const subCmd = args[0]?.toLowerCase();
                const name = args.slice(1).join(' ');
                if (subCmd === 'save' && name) get().saveTemplate(name);
                else if (subCmd === 'apply' && name) {
                    const tmpl = get().templates.find(t => t.name.toLowerCase() === name.toLowerCase());
                    if (tmpl) get().applyTemplate(tmpl.id);
                    else get().showToast(`Template "${name}" not found`);
                } else if (subCmd === 'delete' && name) {
                    const tmpl = get().templates.find(t => t.name.toLowerCase() === name.toLowerCase());
                    if (tmpl) get().deleteTemplate(tmpl.id);
                    else get().showToast(`Template "${name}" not found`);
                } else {
                    get().showToast('Usage: template save|apply|delete <name>');
                }
                break;
            }
            case 'focus': {
                const minutes = parseInt(args[0]) || 25;
                get().startFocus(minutes);
                break;
            }
            case 'use': {
                const slug = args[0];
                if (!slug) { get().showToast('Usage: use <project-slug>'); break; }
                const state = get();
                let project = Object.values(state.projects).find(p => p.slug === slug);
                if (!project) {
                    const newProject: Project = {
                        id: uuidv4(),
                        name: slug.charAt(0).toUpperCase() + slug.slice(1),
                        slug,
                        color: '#83a598',
                        taskOrder: [],
                        createdAt: Date.now(),
                        isInbox: false,
                    };
                    set(s => ({ projects: { ...s.projects, [newProject.id]: newProject } }));
                    project = newProject;
                    get().showToast(`Created project "${project.name}"`);
                }
                get().pushView({ type: 'project', projectId: project.id });
                break;
            }
            case 'journal':
            case 'log': {
                const projectId = get().getCurrentProjectId();
                get().pushView({ type: 'journal', projectId });
                break;
            }
            case 'settings':
                set({ settingsOpen: true });
                break;
            case 'delete':
            case 'rm': {
                const slug = args[0];
                if (slug) get().deleteProject(slug);
                else get().showToast('Usage: delete <project-slug>');
                break;
            }
            default:
                get().showToast(`Unknown command: ${cmd}`);
                get().pushView({ type: 'help' });
                break;
        }
    },

    searchTasks: (query) => {
        get().pushView({ type: 'search', query });
    },

    // --- Focus ---
    startFocus: (minutes, taskId) => {
        set({
            focusTimer: {
                minutes,
                startedAt: Date.now(),
                remaining: minutes * 60,
                taskId,
            },
        });
        get().showToast(`Focus: ${minutes} min`);
    },

    stopFocus: () => {
        set({ focusTimer: null });
        get().showToast('Focus stopped');
    },

    tickFocus: () => set(state => {
        if (!state.focusTimer) return state;
        const elapsed = Math.floor((Date.now() - state.focusTimer.startedAt) / 1000);
        const total = state.focusTimer.minutes * 60;
        const remaining = Math.max(0, total - elapsed);
        return { focusTimer: { ...state.focusTimer, remaining } };
    }),

    // --- Templates ---
    saveTemplate: (name) => {
        const state = get();
        const projectId = state.getCurrentProjectId();
        const tasks = state.getProjectTasks(projectId, null);
        if (tasks.length === 0) {
            get().showToast('No tasks to save as template');
            return;
        }
        const template: Template = {
            id: uuidv4(),
            name,
            tasks: tasks.map(t => ({ content: t.content, indent: t.indent })),
            createdAt: Date.now(),
        };
        set(s => ({ templates: [...s.templates, template] }));
        get().showToast(`Template "${name}" saved (${tasks.length} tasks)`);
    },

    applyTemplate: (templateId) => {
        const state = get();
        const template = state.templates.find(t => t.id === templateId);
        if (!template) return;

        const projectId = state.getCurrentProjectId();
        for (const tmplTask of template.tasks) {
            get().addTask(tmplTask.content, projectId);
        }
        get().showToast(`Applied template "${template.name}"`);
    },

    deleteTemplate: (templateId) => {
        set(s => ({
            templates: s.templates.filter(t => t.id !== templateId),
        }));
        get().showToast('Template deleted');
    },

    // --- Project ---
    deleteProject: (projectSlug) => {
        const state = get();
        const project = Object.values(state.projects).find(p => p.slug === projectSlug);
        if (!project) { get().showToast(`Project "${projectSlug}" not found`); return; }
        if (project.isInbox) { get().showToast('Cannot delete Inbox'); return; }

        const newTasks = { ...state.tasks };
        for (const taskId of project.taskOrder) delete newTasks[taskId];
        const { [project.id]: _, ...remainingProjects } = state.projects;

        set({
            tasks: newTasks,
            projects: remainingProjects,
            viewStack: [{ type: 'home' }],
            selectedItemIndex: 0,
        });
        get().showToast(`Deleted project "${project.name}"`);
    },

    getProjectList: () => {
        return Object.values(get().projects).sort((a, b) => {
            if (a.isInbox) return -1;
            if (b.isInbox) return 1;
            return a.name.localeCompare(b.name);
        });
    },

    getProjectStats: () => {
        const state = get();
        return Object.values(state.projects).map(project => {
            const tasks = project.taskOrder
                .map(id => state.tasks[id])
                .filter(t => t && !t.archived);
            const pending = tasks.filter(t => !t.completed).length;
            const completed = tasks.filter(t => t.completed).length;
            const total = tasks.length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { project, total, pending, completed, progress };
        });
    },

    // --- Undo ---
    undo: () => {
        const state = get();
        const action = state.undoStack[state.undoStack.length - 1];
        if (!action) return;

        const newUndoStack = state.undoStack.slice(0, -1);
        let toastMessage = 'Undone';
        const base = { undoStack: newUndoStack, redoStack: [...state.redoStack, action] };

        switch (action.type) {
            case 'COMPLETE_TASK': {
                const task = state.tasks[action.taskId];
                if (!task) { set({ undoStack: newUndoStack }); return; }
                toastMessage = `Undone: ${task.content}`;
                set({ ...base, tasks: { ...state.tasks, [action.taskId]: { ...task, completed: action.previousState, status: action.previousState ? 'DONE' : 'TODO' } } });
                break;
            }
            case 'ARCHIVE_TASK': {
                toastMessage = `Restored: ${action.task.content}`;
                set({ ...base, tasks: { ...state.tasks, [action.taskId]: action.task } });
                break;
            }
            case 'DELETE_TASK': {
                const project = state.projects[action.task.projectId];
                toastMessage = `Restored: ${action.task.content}`;
                set({
                    ...base,
                    tasks: { ...state.tasks, [action.taskId]: action.task },
                    projects: { ...state.projects, [action.task.projectId]: { ...project, taskOrder: [...project.taskOrder, action.taskId] } },
                });
                break;
            }
            case 'CREATE_TASK': {
                const task = state.tasks[action.taskId];
                if (!task) { set({ undoStack: newUndoStack }); return; }
                const { [action.taskId]: _, ...remainingTasks } = state.tasks;
                const project = state.projects[task.projectId];
                toastMessage = `Removed: ${task.content}`;
                set({
                    ...base,
                    tasks: remainingTasks,
                    projects: { ...state.projects, [task.projectId]: { ...project, taskOrder: project.taskOrder.filter(id => id !== action.taskId) } },
                });
                break;
            }
            case 'STATUS_CHANGE': {
                const task = state.tasks[action.taskId];
                if (!task) { set({ undoStack: newUndoStack }); return; }
                toastMessage = `Status reverted: ${task.content}`;
                const wasCompleted = action.previousStatus === 'DONE' || action.previousStatus === 'CANCELLED';
                set({
                    ...base,
                    tasks: { ...state.tasks, [action.taskId]: { ...task, status: action.previousStatus, completed: wasCompleted } },
                });
                break;
            }
        }
        get().showToast(toastMessage);
    },

    redo: () => {
        const state = get();
        const action = state.redoStack[state.redoStack.length - 1];
        if (!action) return;

        const newRedoStack = state.redoStack.slice(0, -1);
        const base = { undoStack: [...state.undoStack, action], redoStack: newRedoStack };

        switch (action.type) {
            case 'COMPLETE_TASK': {
                const task = state.tasks[action.taskId];
                if (!task) { set({ redoStack: newRedoStack }); return; }
                set({ ...base, tasks: { ...state.tasks, [action.taskId]: { ...task, completed: !action.previousState, status: !action.previousState ? 'DONE' : 'TODO' } } });
                break;
            }
            case 'ARCHIVE_TASK':
                set({ ...base, tasks: { ...state.tasks, [action.taskId]: { ...action.task, archived: true } } });
                break;
            case 'DELETE_TASK': {
                const { [action.taskId]: _, ...remaining } = state.tasks;
                const project = state.projects[action.task.projectId];
                set({
                    ...base,
                    tasks: remaining,
                    projects: { ...state.projects, [action.task.projectId]: { ...project, taskOrder: project.taskOrder.filter(id => id !== action.taskId) } },
                });
                break;
            }
            case 'CREATE_TASK':
            case 'STATUS_CHANGE':
                set({ redoStack: newRedoStack });
                break;
        }
        get().showToast('Redone');
    },

    pushUndo: (action) => set(state => ({
        undoStack: [...state.undoStack.slice(-19), action],
        redoStack: [],
    })),

    // --- Toast ---
    showToast: (message) => set({ toast: { message, timestamp: Date.now() } }),
    clearToast: () => set({ toast: null }),

    // --- Settings ---
    toggleSettings: () => set(state => ({ settingsOpen: !state.settingsOpen })),
    updateSettings: (partial) => set(state => ({
        settings: {
            general: { ...state.settings.general, ...partial.general },
            keybindings: { ...state.settings.keybindings, ...partial.keybindings },
        },
    })),

    // --- Visibility ---
    toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
}));
