import { useEffect } from 'react';
import { useStore } from '../../store';

export function FocusPill() {
    const { focusTimer, tickFocus, stopFocus } = useStore();

    useEffect(() => {
        if (!focusTimer) return;
        const interval = setInterval(tickFocus, 1000);
        return () => clearInterval(interval);
    }, [focusTimer, tickFocus]);

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
