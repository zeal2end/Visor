import { useState } from 'react';
import { useStore } from '../../store';
import { Kbd } from '../common/Kbd';

const STEPS = [
    {
        title: 'Type to add tasks',
        description: 'Just start typing and press Enter. Tasks go to your current project.',
        highlight: <><Kbd keys="type" size="sm" /> <span style={{ color: 'var(--fg4)', margin: '0 4px' }}>then</span> <Kbd keys="Enter" size="sm" /></>,
    },
    {
        title: 'Prefixes change modes',
        description: 'Use prefixes to switch what the input does.',
        highlight: (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Kbd keys=">" size="sm" label="command" />
                <Kbd keys="?" size="sm" label="search" />
                <Kbd keys=":" size="sm" label="journal" />
            </div>
        ),
    },
    {
        title: 'Vim-style navigation',
        description: 'Press ESC for normal mode, then navigate with keyboard shortcuts.',
        highlight: (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Kbd keys="ESC" size="sm" />
                <Kbd keys="j" size="sm" label="down" />
                <Kbd keys="k" size="sm" label="up" />
                <Kbd keys="Space" size="sm" label="done" />
                <Kbd keys="x" size="sm" label="archive" />
            </div>
        ),
    },
    {
        title: 'Projects as contexts',
        description: 'Switch between projects like directories. Your task list updates instantly.',
        highlight: (
            <div style={{ display: 'flex', gap: '8px' }}>
                <code style={{ background: 'var(--bg2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--accent)' }}>&gt; use shop</code>
                <code style={{ background: 'var(--bg2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--accent)' }}>&gt; pop</code>
            </div>
        ),
    },
];

export function WelcomeOverlay() {
    const { settings, updateSettings, dataLoaded } = useStore();
    const [dismissed, setDismissed] = useState(false);
    const [step, setStep] = useState(0);

    if (!dataLoaded || !settings.general.showWelcome || dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        updateSettings({ general: { showWelcome: false } });
    };

    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    return (
        <div className="welcome-overlay">
            <div className="welcome-card">
                <h1 className="welcome-title">Welcome to Visor</h1>
                <p className="welcome-subtitle">Your keyboard-first task overlay</p>

                <div className="welcome-step" key={step}>
                    <h3 className="step-title">{current.title}</h3>
                    <p className="step-desc">{current.description}</p>
                    <div className="step-highlight">{current.highlight}</div>
                </div>

                {/* Step dots */}
                <div className="step-dots">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
                            onClick={() => setStep(i)}
                        />
                    ))}
                </div>

                <div className="welcome-actions">
                    {step > 0 && (
                        <button className="welcome-back" onClick={() => setStep(s => s - 1)}>
                            Back
                        </button>
                    )}
                    {isLast ? (
                        <button className="welcome-dismiss" onClick={handleDismiss}>
                            Get Started
                        </button>
                    ) : (
                        <button className="welcome-next" onClick={() => setStep(s => s + 1)}>
                            Next
                        </button>
                    )}
                </div>
            </div>

            <style>{`
        .welcome-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13, 17, 23, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .welcome-card {
          max-width: 420px;
          padding: 32px;
          text-align: center;
        }

        .welcome-title {
          font-size: 28px;
          color: var(--fg);
          margin: 0 0 4px 0;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: var(--fg4);
          margin: 0 0 28px 0;
        }

        .welcome-step {
          background: var(--bg1);
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 20px;
          text-align: left;
          animation: viewFadeIn 200ms ease-out;
          min-height: 140px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .step-title {
          font-size: 15px;
          color: var(--accent);
          margin: 0;
        }

        .step-desc {
          font-size: 13px;
          color: var(--fg3);
          margin: 0;
          line-height: 1.5;
        }

        .step-highlight {
          margin-top: 8px;
        }

        .step-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--bg3);
          cursor: pointer;
          transition: background 200ms ease, transform 200ms ease;
        }

        .step-dot.active {
          background: var(--accent);
          transform: scale(1.3);
        }

        .step-dot.done {
          background: var(--fg4);
        }

        .welcome-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .welcome-back {
          background: var(--bg2);
          color: var(--fg3);
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-family: var(--font-mono);
          cursor: pointer;
        }

        .welcome-back:hover {
          background: var(--bg3);
          color: var(--fg);
        }

        .welcome-next {
          background: var(--bg2);
          color: var(--fg);
          border: 1px solid var(--accent);
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-mono);
          cursor: pointer;
        }

        .welcome-next:hover {
          background: rgba(88, 166, 255, 0.1);
        }

        .welcome-dismiss {
          background: var(--accent);
          color: var(--bg-hard);
          border: none;
          padding: 10px 32px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-mono);
          cursor: pointer;
        }

        .welcome-dismiss:hover {
          opacity: 0.9;
        }
      `}</style>
        </div>
    );
}
