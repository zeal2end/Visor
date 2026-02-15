import { useState } from 'react';
import { useStore } from '../../store';
import { Kbd } from '../common/Kbd';

const KEYBINDINGS = [
    { action: 'Toggle Visor', keys: 'Ctrl+`' },
    { action: 'Normal mode', keys: 'ESC' },
    { action: 'Insert mode', keys: 'i' },
    { action: 'Move up', keys: 'k' },
    { action: 'Move down', keys: 'j' },
    { action: 'Zone A', keys: 'h' },
    { action: 'Zone B', keys: 'l' },
    { action: 'Complete task', keys: 'Space' },
    { action: 'Archive task', keys: 'x' },
    { action: 'Undo', keys: 'u' },
    { action: 'Redo', keys: 'Ctrl+Shift+Z' },
    { action: 'Hide visor', keys: 'ESC' },
];

type SettingsSection = 'general' | 'keybindings' | 'about';

export function SettingsModal() {
    const { settingsOpen, toggleSettings, settings, updateSettings } = useStore();
    const [activeSection, setActiveSection] = useState<SettingsSection>('general');

    if (!settingsOpen) return null;

    const handleBackdrop = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) toggleSettings();
    };

    return (
        <div className="settings-overlay" onClick={handleBackdrop}>
            <div className="settings-modal">
                <div className="settings-header">
                    <h2>VISOR SETTINGS</h2>
                    <Kbd keys="ESC" size="sm" label="close" />
                </div>

                <div className="settings-layout">
                    {/* Sidebar */}
                    <nav className="settings-nav">
                        {(['general', 'keybindings', 'about'] as SettingsSection[]).map(section => (
                            <button
                                key={section}
                                className={`settings-nav-item ${activeSection === section ? 'active' : ''}`}
                                onClick={() => setActiveSection(section)}
                            >
                                {section.charAt(0).toUpperCase() + section.slice(1)}
                            </button>
                        ))}
                    </nav>

                    {/* Content */}
                    <div className="settings-content">
                        {activeSection === 'general' && (
                            <div className="settings-section">
                                <h3>General</h3>
                                <label className="settings-toggle">
                                    <input
                                        type="checkbox"
                                        checked={settings.general.showWelcome}
                                        onChange={(e) => updateSettings({ general: { showWelcome: e.target.checked } })}
                                    />
                                    <span>Show welcome on launch</span>
                                </label>
                            </div>
                        )}

                        {activeSection === 'keybindings' && (
                            <div className="settings-section">
                                <h3>Keybindings</h3>
                                <div className="keybindings-list">
                                    {KEYBINDINGS.map((kb) => (
                                        <div key={kb.action} className="keybinding-row">
                                            <span className="kb-action">{kb.action}</span>
                                            <Kbd keys={kb.keys} size="sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSection === 'about' && (
                            <div className="settings-section">
                                <h3>About</h3>
                                <div className="about-content">
                                    <div className="about-title">Visor</div>
                                    <div className="about-version">v0.1.0</div>
                                    <p className="about-tagline">Keyboard-first task overlay.</p>
                                    <p className="about-tagline">Drop down. Get things done. Dismiss.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .settings-modal {
          background: var(--bg);
          border: 1px solid var(--bg2);
          border-radius: 8px;
          width: 500px;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--bg2);
        }

        .settings-header h2 {
          margin: 0;
          font-size: 13px;
          color: var(--fg3);
          letter-spacing: 1.5px;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 140px 1fr;
          min-height: 0;
          flex: 1;
        }

        .settings-nav {
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--bg2);
          padding: 8px;
          gap: 2px;
        }

        .settings-nav-item {
          background: none;
          border: none;
          color: var(--fg3);
          font-family: var(--font-mono);
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
        }

        .settings-nav-item:hover {
          background: var(--bg1);
          color: var(--fg);
        }

        .settings-nav-item.active {
          background: var(--bg1);
          color: var(--accent);
          font-weight: 600;
        }

        .settings-content {
          padding: 16px 20px;
          overflow-y: auto;
        }

        .settings-section h3 {
          font-size: 13px;
          color: var(--fg4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--bg2);
        }

        .settings-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: var(--fg);
          padding: 6px 0;
        }

        .settings-toggle input[type="checkbox"] {
          accent-color: var(--accent);
        }

        .keybindings-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .keybinding-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: 4px;
        }

        .keybinding-row:nth-child(odd) {
          background: var(--bg1);
        }

        .kb-action {
          font-size: 13px;
          color: var(--fg);
        }

        .about-content {
          text-align: center;
          padding: var(--spacing-lg) 0;
        }

        .about-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--fg);
          margin-bottom: 4px;
        }

        .about-version {
          font-size: 12px;
          color: var(--fg4);
          margin-bottom: var(--spacing-md);
        }

        .about-tagline {
          font-size: 13px;
          color: var(--fg3);
          margin: 4px 0;
        }
      `}</style>
        </div>
    );
}
