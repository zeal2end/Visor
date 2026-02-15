import { useStore } from '../../store';
import { ViewRenderer } from './ViewRenderer';

export function ContentArea() {
    const { viewStack, lastNavDirection } = useStore();
    const currentView = viewStack[viewStack.length - 1];

    // Generate a key that changes when the view changes
    const viewKey = JSON.stringify(currentView);
    const animClass = lastNavDirection === 'push' ? 'view-push' : 'view-pop';

    return (
        <div className={`content-area ${animClass}`} key={viewKey}>
            <ViewRenderer view={currentView} />
        </div>
    );
}
