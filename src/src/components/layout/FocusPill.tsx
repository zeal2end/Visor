import { useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function FocusPill() {
    const { focusTimer, tickFocus, stopFocus } = useStore();
    const prevRemaining = useRef<number | null>(null);
    const permissionRequested = useRef(false);

    useEffect(() => {
        if (!focusTimer) return;
        const interval = setInterval(tickFocus, 1000);
        return () => clearInterval(interval);
    }, [focusTimer, tickFocus]);

    // Request notification permission on first focus start
    useEffect(() => {
        if (!focusTimer || permissionRequested.current) return;
        permissionRequested.current = true;
        (async () => {
            const granted = await isPermissionGranted();
            if (!granted) {
                await requestPermission();
            }
        })();
    }, [focusTimer]);

    // Detect timer completion: prevRemaining > 0 && current remaining <= 0
    useEffect(() => {
        if (!focusTimer) {
            prevRemaining.current = null;
            return;
        }
        const prev = prevRemaining.current;
        prevRemaining.current = focusTimer.remaining;

        if (prev !== null && prev > 0 && focusTimer.remaining <= 0) {
            // Timer just hit zero — notify and show visor
            (async () => {
                try {
                    const granted = await isPermissionGranted();
                    if (granted) {
                        sendNotification({ title: 'Visor', body: 'Focus session complete!' });
                    }
                } catch { /* ignore notification errors */ }
                try {
                    const win = getCurrentWindow();
                    await win.show();
                    await win.setFocus();
                } catch { /* ignore window errors */ }
            })();
        }
    }, [focusTimer]);

    if (!focusTimer) return null;

    const mins = Math.floor(focusTimer.remaining / 60);
    const secs = focusTimer.remaining % 60;
    const isDone = focusTimer.remaining <= 0;
    const isLow = focusTimer.remaining > 0 && focusTimer.remaining < 300;

    return (
        <div
            className={`focus-pill ${isDone ? 'focus-pill-done' : ''} ${isLow ? 'focus-pill-low' : ''}`}
            onClick={stopFocus}
            title="Click to stop"
        >
            <span className="focus-pill-icon">{isDone ? '\u2713' : '\u25CF'}</span>
            <span className="focus-pill-time">
                {isDone ? 'Done!' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
            </span>
        </div>
    );
}
