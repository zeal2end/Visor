import { useStore } from '../../store';

export function Breadcrumb() {
    const { viewStack, projects, tasks, getViewItems } = useStore();
    const itemCount = getViewItems().length;

    const segments: Array<{ label: string; onClick: () => void }> = [];

    for (let i = 0; i < viewStack.length; i++) {
        const view = viewStack[i];
        const targetLength = i + 1;

        switch (view.type) {
            case 'home':
                segments.push({
                    label: '~',
                    onClick: () => useStore.setState({
                        viewStack: viewStack.slice(0, targetLength),
                        selectedItemIndex: 0,
                        lastNavDirection: 'pop',
                    }),
                });
                break;
            case 'project': {
                const project = projects[view.projectId];
                segments.push({
                    label: project?.slug || '?',
                    onClick: () => useStore.setState({
                        viewStack: viewStack.slice(0, targetLength),
                        selectedItemIndex: 0,
                        lastNavDirection: 'pop',
                    }),
                });
                break;
            }
            case 'thread': {
                const task = tasks[view.parentTaskId];
                const label = task ? (task.content.length > 20 ? task.content.slice(0, 20) + '\u2026' : task.content) : '?';
                segments.push({
                    label,
                    onClick: () => useStore.setState({
                        viewStack: viewStack.slice(0, targetLength),
                        selectedItemIndex: 0,
                        lastNavDirection: 'pop',
                    }),
                });
                break;
            }
            case 'agenda':
                segments.push({ label: 'agenda', onClick: () => useStore.setState({ viewStack: viewStack.slice(0, targetLength), selectedItemIndex: 0, lastNavDirection: 'pop' }) });
                break;
            case 'templates':
                segments.push({ label: 'templates', onClick: () => useStore.setState({ viewStack: viewStack.slice(0, targetLength), selectedItemIndex: 0, lastNavDirection: 'pop' }) });
                break;
            case 'journal':
                segments.push({ label: 'journal', onClick: () => useStore.setState({ viewStack: viewStack.slice(0, targetLength), selectedItemIndex: 0, lastNavDirection: 'pop' }) });
                break;
            case 'help':
                segments.push({ label: 'help', onClick: () => useStore.setState({ viewStack: viewStack.slice(0, targetLength), selectedItemIndex: 0, lastNavDirection: 'pop' }) });
                break;
            case 'search':
                segments.push({ label: `"${view.query}"`, onClick: () => useStore.setState({ viewStack: viewStack.slice(0, targetLength), selectedItemIndex: 0, lastNavDirection: 'pop' }) });
                break;
        }
    }

    return (
        <div className="breadcrumb">
            <div className="breadcrumb-path">
                {segments.map((seg, i) => (
                    <span key={i}>
                        {i > 0 && <span className="breadcrumb-sep">/</span>}
                        <span
                            className={`breadcrumb-segment ${i === segments.length - 1 ? 'active' : ''}`}
                            onClick={seg.onClick}
                        >
                            {seg.label}
                        </span>
                    </span>
                ))}
            </div>
            {itemCount > 0 && (
                <span className="breadcrumb-count">{itemCount}</span>
            )}
        </div>
    );
}
