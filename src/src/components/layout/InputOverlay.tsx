import { useRef, useEffect, useMemo } from 'react';
import { useStore } from '../../store';
import { parseInput, extractContent, parseDueDate } from '../../lib/parser';

interface SuggestItem {
    label: string;
    description: string;
    accept: string;
}

export function InputOverlay() {
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
        inputPurpose,
        inputValue,
        setInputValue,
        inputMode,
        setInputMode,
        hideInput,
        addTask,
        addLogEntry,
        executeCommand,
        searchTasks,
        suggestState,
        updateSuggestions,
        closeSuggestions,
        projects,
        nextIndentLevel,
        setNextIndentLevel,
        editingTaskId,
        updateTask,
        toast,
        clearToast,
    } = useStore();

    // Project suggestions
    const projectSlugs = useMemo(() =>
        Object.values(projects).map(p => ({ slug: p.slug, name: p.name })),
        [projects]
    );

    const localSuggestions = useMemo((): SuggestItem[] => {
        const trimmed = inputValue.trim();
        if (!trimmed || /^[>/?:]/.test(trimmed)) return [];
        if (trimmed.includes(' ') || trimmed.includes(':')) return [];
        const q = trimmed.toLowerCase();
        return projectSlugs
            .filter(p => p.slug.startsWith(q) && p.slug !== q)
            .map(p => ({
                label: `${p.name}:`,
                description: `Add task to ${p.name}`,
                accept: `${p.slug}: `,
            }));
    }, [inputValue, projectSlugs]);

    const allSuggestions: SuggestItem[] = useMemo(() => {
        if (suggestState.isOpen && suggestState.suggestions.length > 0) {
            return suggestState.suggestions.map(cmd => ({
                label: cmd.name,
                description: cmd.description,
                accept: `> ${cmd.name} `,
            }));
        }
        return localSuggestions;
    }, [suggestState, localSuggestions]);

    const showSuggestions = allSuggestions.length > 0;
    const selectedIndex = suggestState.isOpen ? suggestState.selectedIndex : 0;

    // Auto-focus on mount
    useEffect(() => {
        if (inputPurpose === 'notes') {
            textareaRef.current?.focus();
        } else {
            inputRef.current?.focus();
        }
    }, [inputPurpose]);

    // Auto-clear toast
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => clearToast(), 3000);
        return () => clearTimeout(timer);
    }, [toast, clearToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (inputPurpose !== 'notes') {
            const parsed = parseInput(value);
            setInputMode(parsed);

            if (parsed.type === 'COMMAND') {
                updateSuggestions(parsed.command);
            } else {
                closeSuggestions();
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        // Notes mode
        if (inputPurpose === 'notes' && editingTaskId) {
            updateTask(editingTaskId, { notes: inputValue.trim() || null });
            hideInput();
            return;
        }

        // Edit mode
        if (editingTaskId) {
            const content = extractContent(inputValue);
            if (content) {
                const { content: cleanContent, dueAt, scheduled } = parseDueDate(content);
                updateTask(editingTaskId, { content: cleanContent, dueAt, scheduled });
            }
            hideInput();
            return;
        }

        const content = extractContent(inputValue);

        switch (inputMode.type) {
            case 'TASK':
                if (content) addTask(content, inputMode.targetProject || undefined);
                break;
            case 'COMMAND':
                if (content) executeCommand(content);
                break;
            case 'SEARCH':
                if (content) searchTasks(content);
                break;
            case 'LOG':
                if (content) addLogEntry(content);
                break;
        }

        hideInput();
    };

    const doAcceptSuggestion = (index: number) => {
        const item = allSuggestions[index];
        if (!item) return;
        setInputValue(item.accept);
        setInputMode(parseInput(item.accept));
        closeSuggestions();
        inputRef.current?.focus();
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            hideInput();
            return;
        }
        // Cmd/Ctrl+Enter to submit notes
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            hideInput();
            return;
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            if (showSuggestions) {
                doAcceptSuggestion(selectedIndex);
            } else if (inputMode.type === 'TASK') {
                if (e.shiftKey) setNextIndentLevel(Math.max(0, nextIndentLevel - 1));
                else setNextIndentLevel(Math.min(3, nextIndentLevel + 1));
            }
            return;
        }

        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = Math.min(selectedIndex + 1, allSuggestions.length - 1);
                useStore.setState(s => ({ suggestState: { ...s.suggestState, selectedIndex: next, isOpen: true } }));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = Math.max(selectedIndex - 1, 0);
                useStore.setState(s => ({ suggestState: { ...s.suggestState, selectedIndex: prev, isOpen: true } }));
            }
        }
    };

    const purposeClass = `input-overlay-${inputPurpose}`;
    const isNotesMode = inputPurpose === 'notes';

    const ghostText = isNotesMode
        ? '\u2318\u21B5 save notes'
        : editingTaskId
            ? '\u21B5 save'
            : inputPurpose === 'task'
                ? (nextIndentLevel > 0 ? '\u21B5 add subtask' : '\u21B5 add task')
                : inputPurpose === 'command'
                    ? '\u21B5 run'
                    : inputPurpose === 'search'
                        ? '\u21B5 search'
                        : inputPurpose === 'journal'
                            ? '\u21B5 log'
                            : '\u21B5 save';

    return (
        <div className={`input-overlay ${purposeClass}`}>
            {showSuggestions && (
                <div className="suggest-dropdown">
                    {allSuggestions.map((item, i) => (
                        <div
                            key={item.label}
                            className={`suggest-item ${i === selectedIndex ? 'selected' : ''}`}
                            onMouseDown={(e) => { e.preventDefault(); doAcceptSuggestion(i); }}
                            onMouseEnter={() => useStore.setState(s => ({ suggestState: { ...s.suggestState, selectedIndex: i, isOpen: true } }))}
                        >
                            <span className="suggest-name">{item.label}</span>
                            <span className="suggest-desc">{item.description}</span>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="input-overlay-form">
                <div className="input-overlay-wrapper">
                    {nextIndentLevel > 0 && !isNotesMode && (
                        <span className="input-indent-indicator">
                            {'\u203A'.repeat(nextIndentLevel)}
                        </span>
                    )}
                    {isNotesMode ? (
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={handleChange}
                            onKeyDown={handleTextareaKeyDown}
                            placeholder="Add notes... (Cmd+Enter to save)"
                            className="input-overlay-field input-overlay-textarea"
                            rows={4}
                            autoFocus
                        />
                    ) : (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder={editingTaskId ? 'Edit task...' : 'Type here...'}
                            className="input-overlay-field"
                            style={nextIndentLevel > 0 ? { paddingLeft: `${12 + nextIndentLevel * 16}px` } : undefined}
                            autoFocus
                        />
                    )}
                    {inputValue.trim() && (
                        <span className="input-ghost">{ghostText}</span>
                    )}
                </div>
            </form>
        </div>
    );
}
