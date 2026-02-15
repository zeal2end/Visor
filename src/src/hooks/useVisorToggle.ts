import { useEffect, useState, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';

export type VisorState = 'visible' | 'hiding' | 'hidden';

const SLIDE_DURATION = 150; // ms, matches CSS animation

export function useVisorToggle() {
    const [state, setState] = useState<VisorState>('visible');

    const hide = useCallback(async () => {
        setState('hiding');
        // Wait for slide-up animation to finish, then hide the OS window
        setTimeout(async () => {
            await getCurrentWindow().hide();
            setState('hidden');
        }, SLIDE_DURATION);
    }, []);

    const show = useCallback(() => {
        setState('visible');
    }, []);

    useEffect(() => {
        const unlistenHide = listen('visor-hide', () => {
            hide();
        });

        const unlistenShow = listen('visor-show', () => {
            show();
        });

        // Auto-hide when window loses focus
        const handleBlur = () => {
            hide();
        };
        window.addEventListener('blur', handleBlur);

        return () => {
            unlistenHide.then(fn => fn());
            unlistenShow.then(fn => fn());
            window.removeEventListener('blur', handleBlur);
        };
    }, [hide, show]);

    return { state, hide, show };
}
