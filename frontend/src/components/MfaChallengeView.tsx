import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, retroInput, retroButton } from '../styles/retro';
import { fadeIn } from '../styles/motion';

const pulseKeyframes = `
@keyframes amberPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px ${COLORS.ACCENT}; }
  50% { opacity: 0.4; box-shadow: 0 0 12px ${COLORS.ACCENT}; }
}
`;

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
    textAlign: 'center' as const,
  } as React.CSSProperties,
  headingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  heading: {
    fontFamily: FONTS.DISPLAY,
    fontSize: '18px',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    color: COLORS.TEXT_HEADING,
  },
  pulseIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: COLORS.ACCENT,
    boxShadow: `0 0 6px ${COLORS.ACCENT}`,
    flexShrink: 0,
    animation: 'amberPulse 2s ease-in-out infinite',
  } as React.CSSProperties,
  description: {
    fontFamily: FONTS.BODY,
    fontSize: '13px',
    color: COLORS.TEXT_MUTED,
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  codeInput: {
    ...retroInput,
    fontFamily: FONTS.MONO,
    fontSize: '24px',
    letterSpacing: '8px',
    textAlign: 'center' as const,
    padding: '14px 16px',
    marginBottom: '20px',
  } as React.CSSProperties,
  btn: {
    ...retroButton,
    width: '100%',
  } as React.CSSProperties,
  error: {
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.ERROR,
    marginTop: '12px',
  },
  backLink: {
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.TEXT_MUTED,
    cursor: 'pointer',
    marginTop: '20px',
    display: 'inline-block',
    transition: 'color 0.15s',
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
    <div style={styles.page}>
      {/* Inject pulse keyframes */}
      <style>{pulseKeyframes}</style>

      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        {/* System label */}
        <div style={styles.sysLabel}>[ SECURITY VERIFICATION ]</div>

        {/* Form card */}
        <div style={styles.card}>
          {/* Heading with pulsing indicator */}
          <div style={styles.headingRow}>
            <div style={styles.pulseIndicator} />
            <h2 style={styles.heading}>IDENTITY CONFIRMATION</h2>
            <div style={styles.pulseIndicator} />
          </div>

          <p style={styles.description}>
            Enter the 6-digit code from your authenticator app
          </p>

          {/* Code input */}
          <input
            style={styles.codeInput}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={6}
            autoFocus
          />

          <button
            style={styles.btn}
            onClick={handleSubmit}
            disabled={loading || code.length !== 6}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(255,184,0,0.35)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = COLORS.SHADOW_GLOW;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'VERIFYING...' : 'VERIFY'}
          </button>

          {error && <p style={styles.error}>{error}</p>}

          <p
            style={styles.backLink}
            onClick={logout}
            onMouseEnter={e => {
              e.currentTarget.style.color = COLORS.ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = COLORS.TEXT_MUTED;
            }}
          >
            Back to login
          </p>
        </div>
      </motion.div>
    </div>
  );
}
