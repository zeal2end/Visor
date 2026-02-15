import { useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useKeyboard() {
    const {
        inputVisible,
        settingsOpen,
        toggleSettings,
        moveSelection,
        cycleTaskStatus,
        archiveTask,
        undo,
        redo,
        popView,
        pushView,
        getCurrentView,
        getViewItems,
        selectedItemIndex,
        showInput,
        hideInput,
        navigateToTask,
        moveTaskOrder,
        tasks,
    } = useStore();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // --- Global keys (always active) ---

        // Cmd+Shift+Z for redo
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
            e.preventDefault();
            redo();
            return;
        }

        // Cmd+Z for undo
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
            e.preventDefault();
            undo();
            return;
        }

        // ESC: priority cascade — close settings → close input → hide visor
        if (e.key === 'Escape') {
            e.preventDefault();
            if (settingsOpen) {
                toggleSettings();
            } else if (inputVisible) {
                hideInput();
            } else {
                getCurrentWindow().hide();
            }
            return;
        }

        // When input is visible, let InputOverlay handle all keys
        if (inputVisible) return;

        // When settings are open, block browse keys
        if (settingsOpen) return;

        // --- Browse mode keys ---
        const view = getCurrentView();
        const items = getViewItems();
        const selectedItem = items[selectedItemIndex];

        switch (e.key) {
            case 'j':
                e.preventDefault();
                moveSelection('down');
                break;

            case 'k':
                e.preventDefault();
                moveSelection('up');
                break;

            case 'h':
                e.preventDefault();
                popView();
                break;

            case 'l':
            case 'Enter': {
                // Shift+Enter: add subtask
                if (e.shiftKey) {
                    if (view.type === 'detail') {
                        e.preventDefault();
                        const parentTaskId = (view as any).taskId;
                        const parentTask = tasks[parentTaskId];
                        if (parentTask) {
                            pushView({ type: 'thread', projectId: parentTask.projectId, parentTaskId });
                            setTimeout(() => showInput('task'), 50);
                        }
                    } else if (selectedItem?.type === 'task') {
                        e.preventDefault();
                        const task = selectedItem.data;
                        pushView({ type: 'thread', projectId: task.projectId, parentTaskId: task.id });
                        setTimeout(() => showInput('task'), 50);
                    }
                    break;
                }
                e.preventDefault();
                if (!selectedItem) break;

                if (selectedItem.type === 'project') {
                    pushView({ type: 'project', projectId: selectedItem.data.id });
                } else if (selectedItem.type === 'task') {
                    const task = selectedItem.data;
                    // Check if task has children
                    const project = useStore.getState().projects[task.projectId];
                    const hasChildren = project?.taskOrder.some(id => {
                        const t = tasks[id];
                        return t && !t.archived && t.parentId === task.id;
                    });

                    if (hasChildren) {
                        pushView({ type: 'thread', projectId: task.projectId, parentTaskId: task.id });
                    } else if (view.type === 'agenda' || view.type === 'search') {
                        navigateToTask(task.id);
                    } else {
                        // Open detail view for leaf tasks
                        pushView({ type: 'detail', taskId: task.id });
                    }
                } else if (selectedItem.type === 'template') {
                    useStore.getState().applyTemplate(selectedItem.data.id);
                }
                break;
            }

            case ' ':
                e.preventDefault();
                if (view.type === 'detail') {
                    cycleTaskStatus((view as any).taskId);
                } else if (selectedItem?.type === 'task') {
                    cycleTaskStatus(selectedItem.data.id);
                }
                break;

            case 'n':
                if (view.type === 'detail') {
                    e.preventDefault();
                    const detailTaskId = (view as any).taskId;
                    const detailTask = tasks[detailTaskId];
                    useStore.setState({ editingTaskId: detailTaskId });
                    showInput('notes', detailTask?.notes || '');
                }
                break;

            case 'x':
                e.preventDefault();
                if (selectedItem?.type === 'task') {
                    archiveTask(selectedItem.data.id);
                } else if (selectedItem?.type === 'template') {
                    useStore.getState().deleteTemplate(selectedItem.data.id);
                }
                break;

            case 'e':
                e.preventDefault();
                if (view.type === 'detail') {
                    const dtask = tasks[(view as any).taskId];
                    if (dtask) {
                        let input = dtask.content;
                        if (dtask.dueAt) {
                            const due = new Date(dtask.dueAt);
                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                            const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays === 0) input += ' !today';
                            else if (diffDays === 1) input += ' !tomorrow';
                            else {
                                const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                                if (diffDays > 0 && diffDays <= 7) input += ` !${days[due.getDay()]}`;
                                else input += ` !${due.getMonth() + 1}/${due.getDate()}`;
                            }
                        }
                        useStore.setState({ editingTaskId: dtask.id, nextIndentLevel: dtask.indent });
                        showInput('edit', input);
                    }
                } else if (selectedItem?.type === 'project') {
                    pushView({ type: 'project-settings', projectId: selectedItem.data.id });
                } else if (selectedItem?.type === 'task') {
                    const task = selectedItem.data;
                    let input = task.content;
                    if (task.dueAt) {
                        const due = new Date(task.dueAt);
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                        const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays === 0) input += ' !today';
                        else if (diffDays === 1) input += ' !tomorrow';
                        else {
                            const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                            if (diffDays > 0 && diffDays <= 7) input += ` !${days[due.getDay()]}`;
                            else input += ` !${due.getMonth() + 1}/${due.getDate()}`;
                        }
                    }
                    useStore.setState({ editingTaskId: task.id, nextIndentLevel: task.indent });
                    showInput('edit', input);
                }
                break;

            case 'u':
                e.preventDefault();
                undo();
                break;

            case 'i':
                e.preventDefault();
                showInput('task');
                break;

            case '>':
            case '.':
                if (e.shiftKey || e.key === '>') {
                    e.preventDefault();
                    showInput('command', '> ');
                }
                break;

            case '?':
            case '/':
                e.preventDefault();
                showInput('search', e.key === '?' ? '? ' : '');
                break;

            case ':':
                e.preventDefault();
                showInput('journal', ': ');
                break;

            case 'ArrowUp':
                if (e.altKey && selectedItem?.type === 'task') {
                    e.preventDefault();
                    moveTaskOrder(selectedItem.data.id, 'up');
                    moveSelection('up');
                }
                break;

            case 'ArrowDown':
                if (e.altKey && selectedItem?.type === 'task') {
                    e.preventDefault();
                    moveTaskOrder(selectedItem.data.id, 'down');
                    moveSelection('down');
                }
                break;
        }
    }, [inputVisible, settingsOpen, toggleSettings, moveSelection, cycleTaskStatus, archiveTask, undo, redo, popView, pushView, getCurrentView, getViewItems, selectedItemIndex, showInput, hideInput, navigateToTask, moveTaskOrder, tasks]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
