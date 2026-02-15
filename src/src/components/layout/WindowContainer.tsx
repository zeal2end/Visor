import { Breadcrumb } from './Breadcrumb';
import { ContentArea } from './ContentArea';
import { InputOverlay } from './InputOverlay';
import { BrowseHints } from './BrowseHints';
import { FocusPill } from './FocusPill';
import { SettingsModal } from '../settings/SettingsModal';
import { WelcomeOverlay } from '../onboarding/WelcomeOverlay';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useStore } from '../../store';

export function WindowContainer() {
    useKeyboard();
    const { inputVisible, toast, clearToast } = useStore();

    return (
        <div className="window-container glass">
            <div className="titlebar">
                <div className="drag-handle" />
                <FocusPill />
            </div>

            <Breadcrumb />

            <div className="main-content">
                <ContentArea />
            </div>

            {!inputVisible && <BrowseHints />}
            {inputVisible && <InputOverlay />}

            {toast && (
                <div className="toast" key={toast.timestamp} onClick={() => clearToast()}>
                    {toast.message}
                </div>
            )}

            <SettingsModal />
            <WelcomeOverlay />
        </div>
    );
}
