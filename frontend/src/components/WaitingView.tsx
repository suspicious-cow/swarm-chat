import { useState } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { AdminPanel } from './AdminPanel';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    paddingTop: '40px',
    maxWidth: '700px',
    margin: '0 auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
  },
  code: {
    fontSize: '48px',
    fontWeight: 800,
    color: COLORS.ACCENT,
    letterSpacing: '8px',
  },
  copyBtn: {
    background: 'transparent',
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    color: COLORS.TEXT_MUTED,
    padding: '6px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  info: {
    color: COLORS.TEXT_MUTED,
    fontSize: '14px',
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
  pulse: {
    width: '12px',
    height: '12px',
    background: '#4aff4a',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px',
    animation: 'pulse 2s infinite',
  },
  participantBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(124, 138, 255, 0.1)',
    border: '1px solid rgba(124, 138, 255, 0.25)',
    borderRadius: '12px',
    padding: '12px 24px',
  },
  participantCount: {
    fontSize: '28px',
    fontWeight: 700,
    color: COLORS.ACCENT,
  },
  participantLabel: {
    fontSize: '14px',
    color: COLORS.TEXT_MUTED,
  },
  howItWorks: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '560px',
  },
  howTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '16px',
  },
  step: {
    display: 'flex',
    gap: '12px',
    marginBottom: '14px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  stepNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(124, 138, 255, 0.15)',
    color: COLORS.ACCENT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  },
  stepText: {
    color: COLORS.TEXT_MUTED,
  },
};

const csiSteps = [
  'The admin starts the deliberation once enough participants have joined.',
  'You\'ll be placed in a ThinkTank - a small group of 4-7 people plus an AI Surrogate.',
  'Discuss naturally. The Surrogate shares key insights from other ThinkTanks to cross-pollinate ideas.',
  'After deliberation ends, a ranked summary of the group\'s collective intelligence is generated.',
];

export function WaitingView() {
  const { currentSession, currentUser } = useDeliberationStore();
  const [copied, setCopied] = useState(false);

  if (!currentSession || !currentUser) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSession.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <h2 style={styles.title}>{currentSession.title}</h2>

      <div style={styles.code}>{currentSession.join_code}</div>
      <button style={styles.copyBtn} onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy Code'}
      </button>

      <div style={styles.participantBadge}>
        <span style={styles.participantCount}>{currentSession.user_count ?? 0}</span>
        <span style={styles.participantLabel}>
          {(currentSession.user_count ?? 0) === 1 ? 'participant' : 'participants'}<br />joined
        </span>
      </div>

      <p style={styles.info}>
        <span style={styles.pulse} />
        Waiting for participants to join...
        <br />
        Share the code above with your group.
      </p>

      <p style={styles.info}>
        You joined as: <strong>{currentUser.display_name}</strong>
        {currentUser.is_admin && ' (Admin)'}
      </p>

      {currentUser.is_admin && <AdminPanel />}

      <div style={styles.howItWorks}>
        <div style={styles.howTitle}>How This Works</div>
        {csiSteps.map((text, i) => (
          <div key={i} style={styles.step}>
            <div style={styles.stepNum}>{i + 1}</div>
            <div style={styles.stepText}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
