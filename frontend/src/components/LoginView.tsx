import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { SwarmLogo } from './SwarmLogo';
import { COLORS } from '../styles/constants';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '40px',
    paddingTop: '60px',
  },
  hero: {
    textAlign: 'center' as const,
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
    marginBottom: '4px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: COLORS.TEXT_MUTED,
    lineHeight: 1.6,
  },
  card: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '32px',
    width: '340px',
    animation: 'fadeIn 0.3s ease',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: COLORS.BG_INPUT,
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    borderRadius: '8px',
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: COLORS.TEXT_DIM,
    marginBottom: '4px',
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
    marginTop: '8px',
    transition: 'background 0.15s, transform 0.1s',
  } as React.CSSProperties,
  error: {
    color: COLORS.ERROR,
    fontSize: '13px',
    marginTop: '8px',
  },
  toggle: {
    color: COLORS.ACCENT,
    fontSize: '13px',
    marginTop: '16px',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
};

export function LoginView() {
  const { login, register, loading, error } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;
    if (isRegister) {
      if (!displayName.trim()) return;
      await register(username.trim(), password.trim(), displayName.trim(), inviteCode.trim() || undefined);
    } else {
      await login(username.trim(), password.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <SwarmLogo size={56} />
        <h2 style={styles.heroTitle}>Conversational Swarm Intelligence</h2>
        <p style={styles.heroSubtitle}>
          Enable productive real-time group deliberation at scale.
        </p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>{isRegister ? 'Create Account' : 'Sign In'}</h3>

        <label style={styles.label}>Username</label>
        <input
          style={styles.input}
          placeholder="Enter username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {isRegister && (
          <>
            <label style={styles.label}>Display Name</label>
            <input
              style={styles.input}
              placeholder="How others will see you"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <label style={styles.label}>Invite Code</label>
            <input
              style={styles.input}
              placeholder="Enter invite code (first user exempt)"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </>
        )}

        <button
          style={styles.btn}
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={e => {
            e.currentTarget.style.background = COLORS.BUTTON_HOVER;
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = COLORS.BUTTON;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign In'}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        <p
          style={styles.toggle}
          onClick={() => {
            setIsRegister(!isRegister);
            useAuthStore.setState({ error: null });
          }}
        >
          {isRegister
            ? 'Already have an account? Sign in'
            : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  );
}
