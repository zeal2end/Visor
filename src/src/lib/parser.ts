import { InputMode, Recurrence } from '../store/types';

/**
 * Parses input string into structured InputMode
 *
 * Parsing priority:
 * 1. Command mode: starts with > or /
 * 2. Search mode: starts with ?
 * 3. Log/journal mode: starts with : (colon + space)
 * 4. Project-targeted task: pattern {project}: {task}
 * 5. Default task: everything else
 */
export function parseInput(input: string): InputMode {
    const trimmed = input.trim();

    // Empty input
    if (!trimmed) {
        return { type: 'TASK', targetProject: null };
    }

    // Command mode: > or /
    if (/^[>/]\s*/.test(trimmed)) {
        const command = trimmed.replace(/^[>/]\s*/, '');
        return { type: 'COMMAND', command };
    }

    // Search mode: ?
    if (/^\?\s*/.test(trimmed)) {
        const query = trimmed.replace(/^\?\s*/, '');
        return { type: 'SEARCH', query };
    }

    // Log/journal mode: : at start (not word:)
    if (/^:\s*/.test(trimmed)) {
        const content = trimmed.replace(/^:\s*/, '');
        return { type: 'LOG', content };
    }

    // Project-targeted task: {project}: {task}
    const projectMatch = trimmed.match(/^(\w+):\s+(.+)$/);
    if (projectMatch) {
        const [, projectSlug, content] = projectMatch;
        // Make sure it's not a single word followed by colon at end
        if (content) {
            return { type: 'TASK', targetProject: projectSlug.toLowerCase() };
        }
    }

    // Default task
    return { type: 'TASK', targetProject: null };
}

/**
 * Extracts the actual content from input (removing mode prefixes)
 */
export function extractContent(input: string): string {
    const trimmed = input.trim();

    // Command mode
    if (/^[>/]\s*/.test(trimmed)) {
        return trimmed.replace(/^[>/]\s*/, '');
    }

    // Search mode
    if (/^\?\s*/.test(trimmed)) {
        return trimmed.replace(/^\?\s*/, '');
    }

    // Log/journal mode
    if (/^:\s*/.test(trimmed)) {
        return trimmed.replace(/^:\s*/, '');
    }

    // Project-targeted task
    const projectMatch = trimmed.match(/^(\w+):\s+(.+)$/);
    if (projectMatch && projectMatch[2]) {
        return projectMatch[2];
    }

    // Default
    return trimmed;
}

/**
 * Get display label for input mode
 */
export function getModeLabel(mode: InputMode): string {
    switch (mode.type) {
        case 'TASK':
            return mode.targetProject
                ? `TASK → ${mode.targetProject.toUpperCase()}`
                : 'TASK → INBOX';
        case 'COMMAND':
            return 'CMD';
        case 'SEARCH':
            return 'SEARCH';
        case 'LOG':
            return 'LOG';
    }
}

/**
 * Get CSS class for mode badge
 */
export function getModeClass(mode: InputMode): string {
    switch (mode.type) {
        case 'TASK':
            return 'task';
        case 'COMMAND':
            return 'command';
        case 'SEARCH':
            return 'search';
        case 'LOG':
            return 'log';
    }
}

/**
 * Get placeholder text based on current mode
 */
export function getPlaceholder(): string {
    return '"task" | > command | ? search | : journal';
}

/**
 * Parse inline due date from task content.
 * Supports:
 *   !today, !tomorrow, !mon-!sun, !1/20  — DEADLINE (must be done by)
 *   @today, @tomorrow, @mon-@sun, @1/20  — SCHEDULED (start working on)
 * Returns { content (cleaned), dueAt, scheduled }
 */
export function parseDueDate(content: string): { content: string; dueAt: number | null; scheduled: number | null; recurrence: Recurrence | null } {
    let dueAt: number | null = null;
    let scheduled: number | null = null;
    let recurrence: Recurrence | null = null;
    let cleaned = content;

    // Parse recurrence (!every <pattern>) — must be checked before deadline
    const recurrenceMatch = cleaned.match(/\s*!every\s+(day|weekday|week|month|mon|tue|wed|thu|fri|sat|sun)\s*/i);
    if (recurrenceMatch) {
        const pattern = recurrenceMatch[1].toLowerCase();
        cleaned = cleaned.replace(recurrenceMatch[0], ' ').trim();

        if (pattern === 'day') {
            recurrence = { type: 'daily' };
        } else if (pattern === 'weekday') {
            recurrence = { type: 'weekdays' };
        } else if (pattern === 'week') {
            recurrence = { type: 'weekly' };
        } else if (pattern === 'month') {
            recurrence = { type: 'monthly' };
        } else {
            const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const dayOfWeek = days.indexOf(pattern);
            recurrence = { type: 'weekly', dayOfWeek };
        }
    }

    // Parse deadline (!token)
    const deadlineMatch = cleaned.match(/\s*!(today|tomorrow|tom|mon|tue|wed|thu|fri|sat|sun|\d{1,2}\/\d{1,2})\s*/i);
    if (deadlineMatch) {
        dueAt = resolveDate(deadlineMatch[1]);
        cleaned = cleaned.replace(deadlineMatch[0], ' ').trim();
    }

    // Parse scheduled (@token)
    const scheduledMatch = cleaned.match(/\s*@(today|tomorrow|tom|mon|tue|wed|thu|fri|sat|sun|\d{1,2}\/\d{1,2})\s*/i);
    if (scheduledMatch) {
        scheduled = resolveDate(scheduledMatch[1]);
        cleaned = cleaned.replace(scheduledMatch[0], ' ').trim();
    }

    // If recurrence set but no explicit dueAt, auto-compute first occurrence
    if (recurrence && !dueAt) {
        dueAt = computeNextOccurrence(recurrence);
    }

    return { content: cleaned, dueAt, scheduled, recurrence };
}

export function computeNextOccurrence(recurrence: Recurrence): number {
    const now = new Date();
    const target = new Date(now);
    const setEndOfDay = (d: Date) => { d.setHours(23, 59, 59, 0); return d; };

    switch (recurrence.type) {
        case 'daily':
            target.setDate(target.getDate() + 1);
            return setEndOfDay(target).getTime();
        case 'weekdays': {
            target.setDate(target.getDate() + 1);
            while (target.getDay() === 0 || target.getDay() === 6) {
                target.setDate(target.getDate() + 1);
            }
            return setEndOfDay(target).getTime();
        }
        case 'weekly': {
            if (recurrence.dayOfWeek !== undefined) {
                const currentDay = now.getDay();
                let diff = recurrence.dayOfWeek - currentDay;
                if (diff <= 0) diff += 7;
                target.setDate(target.getDate() + diff);
            } else {
                target.setDate(target.getDate() + 7);
            }
            return setEndOfDay(target).getTime();
        }
        case 'monthly':
            target.setMonth(target.getMonth() + 1);
            return setEndOfDay(target).getTime();
    }
}

function resolveDate(token: string): number {
    const t = token.toLowerCase();
    const now = new Date();
    const target = new Date(now);

    const setEndOfDay = (d: Date) => { d.setHours(23, 59, 59, 0); return d; };

    if (t === 'today') {
        setEndOfDay(target);
    } else if (t === 'tomorrow' || t === 'tom') {
        target.setDate(target.getDate() + 1);
        setEndOfDay(target);
    } else if (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(t)) {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const targetDay = days.indexOf(t);
        const currentDay = now.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        target.setDate(target.getDate() + diff);
        setEndOfDay(target);
    } else if (t.includes('/')) {
        const [month, day] = t.split('/').map(Number);
        target.setMonth(month - 1, day);
        if (target < now) target.setFullYear(target.getFullYear() + 1);
        setEndOfDay(target);
    }

    return target.getTime();
}

