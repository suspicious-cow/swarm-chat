import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    paddingTop: '80px',
  },
  card: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '32px',
    width: '340px',
    textAlign: 'center' as const,
    animation: 'fadeIn 0.3s ease',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '13px',
    color: COLORS.TEXT_MUTED,
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: COLORS.BG_INPUT,
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    borderRadius: '8px',
    color: COLORS.TEXT_PRIMARY,
    fontSize: '20px',
    letterSpacing: '6px',
    textAlign: 'center' as const,
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: COLORS.BUTTON,
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
  } as React.CSSProperties,
  error: {
    color: COLORS.ERROR,
    fontSize: '13px',
    marginTop: '8px',
  },
  backLink: {
    color: COLORS.ACCENT,
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '12px',
  },
};

export function MfaChallengeView() {
  const { verifyMfa, logout, loading, error } = useAuthStore();
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (code.trim().length !== 6) return;
    await verifyMfa(code.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Two-Factor Authentication</h3>
        <p style={styles.subtitle}>Enter the 6-digit code from your authenticator app</p>

        <input
          style={styles.input}
          placeholder="000000"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={handleKeyDown}
          maxLength={6}
          autoFocus
        />

        <button
          style={styles.btn}
          onClick={handleSubmit}
          disabled={loading || code.length !== 6}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.BUTTON_HOVER;
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = COLORS.BUTTON;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        <p style={styles.backLink} onClick={logout}>
          Back to login
        </p>
      </div>
    </div>
  );
}
