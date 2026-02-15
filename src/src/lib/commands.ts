export interface CommandDef {
    name: string;
    description: string;
    aliases?: string[];
    category: 'navigation' | 'action' | 'view' | 'system';
}

export const COMMAND_REGISTRY: CommandDef[] = [
    { name: 'home', description: 'Dashboard with upcoming & due tasks', category: 'navigation' },
    { name: 'agenda', description: 'Deadlines & scheduled tasks', category: 'view' },
    { name: 'help', description: 'Show command reference', category: 'view' },
    { name: 'focus', description: 'Start focus timer (minutes)', aliases: ['pomodoro'], category: 'action' },
    { name: 'use', description: 'Switch to project context', category: 'navigation' },
    { name: 'templates', description: 'Manage task templates', category: 'view' },
    { name: 'template save', description: 'Save current tasks as template', category: 'action' },
    { name: 'template apply', description: 'Apply a template', category: 'action' },
    { name: 'delete', description: 'Delete a project (> delete slug)', aliases: ['rm'], category: 'action' },
    { name: 'journal', description: 'View journal entries', aliases: ['log'], category: 'view' },
    { name: 'settings', description: 'Open settings panel', category: 'system' },
];

export function filterCommands(query: string): CommandDef[] {
    const q = query.toLowerCase().trim();
    if (!q) return COMMAND_REGISTRY;

    return COMMAND_REGISTRY.filter(cmd => {
        if (cmd.name.startsWith(q)) return true;
        if (cmd.aliases?.some(a => a.startsWith(q))) return true;
        if (cmd.description.toLowerCase().includes(q)) return true;
        return false;
    });
}
