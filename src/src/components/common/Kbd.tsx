interface KbdProps {
    keys: string;
    label?: string;
    size?: 'sm' | 'md';
}

export function Kbd({ keys, label, size = 'md' }: KbdProps) {
    const parts = keys.split('+').map(k => k.trim());
    const sizeClass = size === 'sm' ? 'kbd-sm' : '';

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            {parts.map((part, i) => (
                <span key={i}>
                    {i > 0 && <span style={{ color: 'var(--fg4)', fontSize: '10px', margin: '0 1px' }}>+</span>}
                    <kbd className={sizeClass}>{part}</kbd>
                </span>
            ))}
            {label && <span style={{ color: 'var(--fg4)', fontSize: '11px', marginLeft: '4px' }}>{label}</span>}
        </span>
    );
}
