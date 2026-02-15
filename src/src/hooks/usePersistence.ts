import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useStore } from '../store';
import { Settings, DEFAULT_SETTINGS, ViewEntry, Template } from '../store/types';

interface PersistedData {
    tasks: Record<string, any>;
    projects: Record<string, any>;
    logEntries: any[];
    settings?: Settings;
    templates?: Template[];
    viewStack?: ViewEntry[];
    // V1 compat fields
    currentProjectId?: string;
    contextStack?: string[];
}

export function usePersistence() {
    const hasLoaded = useRef(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastExternalUpdate = useRef(0);

    // Load data on mount
    useEffect(() => {
        async function load() {
            try {
                const raw = await invoke<string>('load_data');
                if (raw && raw !== 'null') {
                    const data: PersistedData = JSON.parse(raw);
                    const store = useStore.getState();

                    // Deduplicate projects by slug
                    let projects = data.projects || store.projects;
                    const seenSlugs = new Set<string>();
                    const cleanProjects: Record<string, any> = {};
                    for (const [id, project] of Object.entries(projects)) {
                        if (!seenSlugs.has((project as any).slug)) {
                            seenSlugs.add((project as any).slug);
                            cleanProjects[id] = project;
                        }
                    }

                    // Migrate tasks: add status/scheduled fields if missing
                    const migratedTasks: Record<string, any> = {};
                    for (const [id, task] of Object.entries(data.tasks || store.tasks)) {
                        const t = task as any;
                        migratedTasks[id] = {
                            ...t,
                            status: t.status || (t.completed ? 'DONE' : 'TODO'),
                            scheduled: t.scheduled ?? null,
                            recurrence: t.recurrence ?? null,
                        };
                    }

                    // Migration: V1 -> V2 view stack
                    let viewStack: ViewEntry[] = [{ type: 'home' }];
                    if (data.viewStack && Array.isArray(data.viewStack) && data.viewStack.length > 0) {
                        // V2 data -- use as-is, but validate entries
                        viewStack = data.viewStack.filter(v => {
                            if (v.type === 'project' && !cleanProjects[(v as any).projectId]) return false;
                            if (v.type === 'thread' && !cleanProjects[(v as any).projectId]) return false;
                            if (v.type === 'journal' && !cleanProjects[(v as any).projectId]) return false;
                            if (v.type === 'project-settings' && !cleanProjects[(v as any).projectId]) return false;
                            if (v.type === 'detail' && !migratedTasks[(v as any).taskId]) return false;
                            return true;
                        });
                        if (viewStack.length === 0) viewStack = [{ type: 'home' }];
                    } else if (data.contextStack) {
                        // V1 migration: convert contextStack to viewStack
                        viewStack = [{ type: 'home' }];
                        const lastProjectId = data.contextStack[data.contextStack.length - 1];
                        if (lastProjectId && cleanProjects[lastProjectId]) {
                            viewStack.push({ type: 'project', projectId: lastProjectId });
                        }
                    }

                    useStore.setState({
                        tasks: migratedTasks,
                        projects: cleanProjects,
                        logEntries: data.logEntries || store.logEntries,
                        settings: data.settings || DEFAULT_SETTINGS,
                        templates: data.templates || [],
                        viewStack,
                        dataLoaded: true,
                    });
                } else {
                    useStore.setState({ dataLoaded: true });
                }
            } catch (e) {
                console.error('Failed to load persisted data:', e);
                useStore.setState({ dataLoaded: true });
            }
            hasLoaded.current = true;
        }
        load();
    }, []);

    // Listen for external data changes (from HTTP API server)
    useEffect(() => {
        let unlisten: (() => void) | null = null;
        (async () => {
            unlisten = await listen('data-changed', async () => {
                lastExternalUpdate.current = Date.now();
                try {
                    const raw = await invoke<string>('load_data');
                    if (raw && raw !== 'null') {
                        const data: PersistedData = JSON.parse(raw);
                        const store = useStore.getState();

                        // Migrate tasks
                        const migratedTasks: Record<string, any> = {};
                        for (const [id, task] of Object.entries(data.tasks || {})) {
                            const t = task as any;
                            migratedTasks[id] = {
                                ...t,
                                status: t.status || (t.completed ? 'DONE' : 'TODO'),
                                scheduled: t.scheduled ?? null,
                                recurrence: t.recurrence ?? null,
                            };
                        }

                        // Only update data, not UI state (viewStack, selectedItemIndex, etc.)
                        useStore.setState({
                            tasks: migratedTasks,
                            projects: data.projects || store.projects,
                            logEntries: data.logEntries || store.logEntries,
                            templates: data.templates || store.templates,
                        });
                    }
                } catch (e) {
                    console.error('Failed to reload data after external change:', e);
                }
            });
        })();
        return () => { unlisten?.(); };
    }, []);

    // Save on changes (debounced 500ms)
    useEffect(() => {
        const unsub = useStore.subscribe((state, prev) => {
            if (!hasLoaded.current) return;

            // Skip save if we just loaded from external update (prevents write-back race)
            if (Date.now() - lastExternalUpdate.current < 1000) return;

            // Only save when persistable data changed
            if (
                state.tasks === prev.tasks &&
                state.projects === prev.projects &&
                state.logEntries === prev.logEntries &&
                state.settings === prev.settings &&
                state.templates === prev.templates &&
                state.viewStack === prev.viewStack
            ) return;

            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                // Re-check to prevent race
                if (Date.now() - lastExternalUpdate.current < 1000) return;

                const s = useStore.getState();
                const data: PersistedData = {
                    tasks: s.tasks,
                    projects: s.projects,
                    logEntries: s.logEntries,
                    settings: s.settings,
                    templates: s.templates,
                    viewStack: s.viewStack,
                };

                invoke('save_data', { data: JSON.stringify(data) }).catch((e) =>
                    console.error('Failed to save data:', e)
                );
            }, 500);
        });

        return () => {
            unsub();
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, []);
}
