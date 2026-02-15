import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
                        };
                    }

                    // Migration: V1 -> V2 view stack
                    let viewStack: ViewEntry[] = [{ type: 'home' }];
                    if (data.viewStack && Array.isArray(data.viewStack) && data.viewStack.length > 0) {
                        // V2 data -- use as-is, but validate entries
                        viewStack = data.viewStack.filter(v => {
                            if (v.type === 'project' && !cleanProjects[v.projectId]) return false;
                            if (v.type === 'thread' && !cleanProjects[v.projectId]) return false;
                            if (v.type === 'journal' && !cleanProjects[v.projectId]) return false;
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

    // Save on changes (debounced 500ms)
    useEffect(() => {
        const unsub = useStore.subscribe((state, prev) => {
            if (!hasLoaded.current) return;

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
