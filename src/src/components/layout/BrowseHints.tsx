import { useStore } from '../../store';
import { Kbd } from '../common/Kbd';

export function BrowseHints() {
    const view = useStore(s => s.getCurrentView());

    let hints: Array<{ keys: string; label: string }> = [];

    switch (view.type) {
        case 'home':
            hints = [
                { keys: 'j/k', label: '\u2195' },
                { keys: 'Enter', label: '\u2192' },
                { keys: 'i', label: 'add' },
                { keys: '>', label: 'cmd' },
            ];
            break;
        case 'project':
        case 'thread':
            hints = [
                { keys: 'j/k', label: '\u2195' },
                { keys: 'Enter', label: '\u2192' },
                { keys: 'Space', label: '\u25CE' },
                { keys: 'h', label: '\u2190' },
                { keys: 'i', label: 'add' },
            ];
            break;
        case 'agenda':
        case 'search':
            hints = [
                { keys: 'j/k', label: '\u2195' },
                { keys: 'Enter', label: 'go' },
                { keys: 'Space', label: '\u25CE' },
                { keys: 'h', label: '\u2190' },
            ];
            break;
        case 'templates':
            hints = [
                { keys: 'j/k', label: '\u2195' },
                { keys: 'Enter', label: 'apply' },
                { keys: 'x', label: 'delete' },
                { keys: 'h', label: '\u2190' },
            ];
            break;
        case 'detail':
            hints = [
                { keys: 'e', label: 'edit' },
                { keys: 'n', label: 'notes' },
                { keys: 'Space', label: '\u25CE' },
                { keys: 'Shift+\u21B5', label: 'subtask' },
                { keys: 'h', label: '\u2190' },
            ];
            break;
        case 'project-settings':
            hints = [
                { keys: '>', label: 'cmd' },
                { keys: 'h', label: '\u2190' },
            ];
            break;
        default:
            hints = [
                { keys: 'h', label: '\u2190 back' },
                { keys: 'i', label: 'add' },
            ];
    }

    return (
        <div className="browse-hints">
            {hints.map((h, i) => (
                <span key={i} className="browse-hint">
                    <Kbd keys={h.keys} size="sm" />
                    <span className="browse-hint-label">{h.label}</span>
                </span>
            ))}
        </div>
    );
}
