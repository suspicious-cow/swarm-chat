import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
    paddingTop: '20px',
    animation: 'fadeIn 0.3s ease',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
  },
  card: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '14px',
    padding: '32px',
    boxShadow: COLORS.SHADOW_SM,
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: COLORS.TEXT_MUTED,
    marginBottom: '6px',
  },
  helper: {
    fontSize: '12px',
    color: COLORS.TEXT_DIM,
    marginTop: '2px',
    marginBottom: '14px',
    lineHeight: 1.5,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: COLORS.BG_INPUT,
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    borderRadius: '8px',
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: COLORS.GRADIENT_PRIMARY,
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'opacity 0.15s, transform 0.15s',
    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    color: COLORS.ERROR,
    fontSize: '13px',
    marginTop: '8px',
  },
  // Created state
  createdContainer: {
    maxWidth: '480px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    paddingTop: '40px',
    textAlign: 'center' as const,
  },
  createdTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
  },
  createdSubtitle: {
    fontSize: '14px',
    color: COLORS.TEXT_MUTED,
    lineHeight: 1.5,
  },
  codeDisplay: {
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
  enterBtn: {
    padding: '12px 40px',
    background: COLORS.GRADIENT_PRIMARY,
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.15s',
    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
  },
};

export function NewSessionView() {
  const { account } = useAuthStore();
  const { createSession, joinSession, currentSession, currentUser, error, setView } = useDeliberationStore();
  const [title, setTitle] = useState('');
  const [size, setSize] = useState(5);
  const [creating, setCreating] = useState(false);
  const [entering, setEntering] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    await createSession(title.trim(), size);
    setCreating(false);
  };

  const handleEnter = async () => {
    const state = useDeliberationStore.getState();
    if (!state.currentSession || !account || entering) return;
    setEntering(true);
    await joinSession(state.currentSession.join_code, account.display_name);
    setEntering(false);
  };

  const handleCopy = () => {
    if (currentSession?.join_code) {
      navigator.clipboard.writeText(currentSession.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show "session created" screen
  if (currentSession && !currentUser) {
    return (
      <div style={styles.createdContainer}>
        <h2 style={styles.createdTitle}>Session Created!</h2>
        <p style={styles.createdSubtitle}>
          Share this code with participants so they can join the deliberation.
        </p>
        <div style={styles.codeDisplay}>{currentSession.join_code}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={styles.copyBtn} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <p style={{ fontSize: '14px', color: COLORS.TEXT_MUTED }}>
          {currentSession.title}
        </p>
        <button
          style={{
            ...styles.enterBtn,
            ...(entering ? styles.btnDisabled : {}),
          }}
          onClick={handleEnter}
          disabled={entering}
        >
          {entering ? 'Entering...' : 'Enter Session'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create a New Session</h2>

      <div style={styles.card}>
        <label style={styles.label}>Deliberation topic / question</label>
        <input
          style={styles.input}
          placeholder="e.g. Should cities ban cars from downtown?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <p style={styles.helper}>
          Frame as a clear question to guide focused discussion.
        </p>

        <label style={styles.label}>ThinkTank size (3-10)</label>
        <input
          style={{ ...styles.input, marginBottom: 0 }}
          type="number"
          min={3}
          max={10}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
        />
        <p style={styles.helper}>
          Research shows groups of 4-7 participants with an AI Surrogate produce
          optimal deliberation. Default of 5 is recommended.
        </p>

        <button
          style={{
            ...styles.btn,
            ...(creating || !title.trim() ? styles.btnDisabled : {}),
          }}
          onClick={handleCreate}
          disabled={creating || !title.trim()}
        >
          {creating ? 'Creating...' : 'Create Session'}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
