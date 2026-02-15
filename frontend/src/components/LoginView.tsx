import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { SwarmLogo } from './SwarmLogo';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, retroInput, retroButton } from '../styles/retro';
import { fadeIn } from '../styles/motion';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    background: COLORS.GRADIENT_HERO,
    padding: '24px',
  },
  logoWrap: {
    marginBottom: '16px',
    boxShadow: COLORS.SHADOW_GLOW,
    borderRadius: '50%',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sysLabel: {
    ...systemLabel,
    marginBottom: '24px',
    color: COLORS.TEXT_MUTED,
  } as React.CSSProperties,
  card: {
    ...instrumentCard,
    padding: '32px',
    width: '380px',
    maxWidth: '100%',
  } as React.CSSProperties,
  heading: {
    fontFamily: FONTS.DISPLAY,
    fontSize: '26px',
    fontWeight: 600,
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
    color: COLORS.TEXT_HEADING,
    marginBottom: '24px',
    textAlign: 'center' as const,
  },
  label: {
    display: 'block',
    fontFamily: FONTS.MONO,
    fontSize: '15px',
    fontWeight: 500,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    color: COLORS.TEXT_MUTED,
    marginBottom: '6px',
  },
  inputWrap: {
    marginBottom: '16px',
  },
  input: {
    ...retroInput,
  } as React.CSSProperties,
  btn: {
    ...retroButton,
    width: '100%',
    marginTop: '8px',
  } as React.CSSProperties,
  error: {
    fontFamily: FONTS.MONO,
    fontSize: '16px',
    color: COLORS.ERROR,
    marginTop: '12px',
    textAlign: 'center' as const,
  },
  toggle: {
    fontFamily: FONTS.MONO,
    fontSize: '16px',
    color: COLORS.TEXT_MUTED,
    marginTop: '20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'color 0.15s',
  },
  toggleAccent: {
    color: COLORS.ACCENT,
  },
};

const focusStyle = {
  boxShadow: '0 0 12px rgba(255,184,0,0.2)',
  borderColor: COLORS.ACCENT,
};

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  Object.assign(e.currentTarget.style, focusStyle);
}

function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.boxShadow = '';
  e.currentTarget.style.borderColor = COLORS.BORDER;
}

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
    <div style={styles.page}>
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* Logo with amber glow */}
        <div style={styles.logoWrap}>
          <SwarmLogo size={56} />
        </div>

        {/* System label */}
        <div style={styles.sysLabel}>[ SYSTEM ACCESS ]</div>

        {/* Form card */}
        <div style={styles.card}>
          <h2 style={styles.heading}>
            {isRegister ? 'CREATE ACCOUNT' : 'AUTHENTICATE'}
          </h2>

          {/* Username */}
          <div style={styles.inputWrap}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Password */}
          <div style={styles.inputWrap}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {isRegister && (
            <>
              {/* Display Name */}
              <div style={styles.inputWrap}>
                <label style={styles.label}>Display Name</label>
                <input
                  style={styles.input}
                  placeholder="How others will see you"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Invite Code */}
              <div style={styles.inputWrap}>
                <label style={styles.label}>Invite Code</label>
                <input
                  style={styles.input}
                  placeholder="Enter invite code (first user exempt)"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </>
          )}

          <button
            style={styles.btn}
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(255,184,0,0.35)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = COLORS.SHADOW_GLOW;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'PLEASE WAIT...' : isRegister ? 'REGISTER' : 'SIGN IN'}
          </button>

          {error && <p style={styles.error}>{error}</p>}

          <p
            style={styles.toggle}
            onClick={() => {
              setIsRegister(!isRegister);
              useAuthStore.setState({ error: null });
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = COLORS.ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = COLORS.TEXT_MUTED;
            }}
          >
            {isRegister
              ? 'Already have an account? Sign in'
              : "Don't have an account? Register"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
