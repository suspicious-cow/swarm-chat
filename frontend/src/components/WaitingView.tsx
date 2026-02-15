import { useState } from 'react';
import { motion } from 'motion/react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { AdminPanel } from './AdminPanel';
import { COLORS, FONTS } from '../styles/constants';
import { systemLabel, dataReadout, statusLed, phosphorHeading } from '../styles/retro';
import { fadeIn, staggerContainer, staggerItem, pulseVariant } from '../styles/motion';

const csiSteps = [
  'The admin starts the deliberation once enough participants have joined.',
  'You\'ll be placed in a ThinkTank - a small group of 4-7 people plus an AI Surrogate.',
  'Discuss naturally. The Surrogate shares key insights from other ThinkTanks to cross-pollinate ideas.',
  'After deliberation ends, a ranked summary of the group\'s collective intelligence is generated.',
];

type StepStatus = 'done' | 'current' | 'pending';

function getStepStatuses(sessionStatus: string): StepStatus[] {
  if (sessionStatus === 'completed') return ['done', 'done', 'done', 'done'];
  if (sessionStatus === 'active') return ['done', 'done', 'current', 'pending'];
  // waiting
  return ['current', 'pending', 'pending', 'pending'];
}

function ledColorForStatus(status: StepStatus): string {
  if (status === 'done') return COLORS.SUCCESS;
  if (status === 'current') return COLORS.ACCENT;
  return COLORS.TEXT_DIM;
}

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
  systemLabel: {
    ...systemLabel,
    marginBottom: '4px',
  } as React.CSSProperties,
  heading: {
    ...phosphorHeading,
    fontSize: '28px',
    letterSpacing: '3px',
    margin: 0,
  },
  sessionTitle: {
    fontFamily: FONTS.BODY,
    fontSize: '16px',
    color: COLORS.TEXT_MUTED,
    margin: 0,
    marginTop: '-8px',
  },
  codeReadout: {
    ...dataReadout,
    fontSize: '28px',
    fontWeight: 600,
    letterSpacing: '10px',
    padding: '14px 28px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  copyBtn: {
    background: 'transparent',
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    color: COLORS.TEXT_MUTED,
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    padding: '6px 18px',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  } as React.CSSProperties,
  copyBtnHover: {
    borderColor: COLORS.ACCENT,
    color: COLORS.ACCENT,
    boxShadow: COLORS.SHADOW_GLOW,
  },
  participantReadout: {
    ...dataReadout,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
  } as React.CSSProperties,
  participantCount: {
    fontFamily: FONTS.MONO,
    fontSize: '28px',
    fontWeight: 700,
    color: COLORS.ACCENT,
  },
  participantLabel: {
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.TEXT_MUTED,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  info: {
    fontFamily: FONTS.BODY,
    color: COLORS.TEXT_MUTED,
    fontSize: '14px',
    textAlign: 'center' as const,
    lineHeight: 1.6,
    margin: 0,
  },
  stepsPanel: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '2px',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_SM}`,
    padding: '24px',
    width: '100%',
    maxWidth: '560px',
  },
  stepsTitle: {
    ...systemLabel,
    marginBottom: '18px',
  } as React.CSSProperties,
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '14px',
  },
  stepLedWrap: {
    paddingTop: '5px',
    flexShrink: 0,
  },
  stepText: {
    fontFamily: FONTS.BODY,
    fontSize: '13px',
    lineHeight: 1.5,
    color: COLORS.TEXT_MUTED,
  },
  stepTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  joinedAs: {
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.TEXT_MUTED,
    textAlign: 'center' as const,
    margin: 0,
  },
};

export function WaitingView() {
  const { currentSession, currentUser } = useDeliberationStore();
  const [copied, setCopied] = useState(false);
  const [copyHover, setCopyHover] = useState(false);

  if (!currentSession || !currentUser) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSession.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepStatuses = getStepStatuses(currentSession.status);

  return (
    <motion.div
      style={styles.container}
      {...fadeIn}
    >
      <style>{`
        @keyframes ledPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
      `}</style>

      <div style={styles.systemLabel}>[ PRE-LAUNCH HOLD ]</div>

      <h2 style={styles.heading}>AWAITING LAUNCH</h2>

      <p style={styles.sessionTitle}>{currentSession.title}</p>

      <div style={styles.codeReadout}>{currentSession.join_code}</div>

      <button
        style={{
          ...styles.copyBtn,
          ...(copyHover ? styles.copyBtnHover : {}),
        }}
        onClick={handleCopy}
        onMouseEnter={() => setCopyHover(true)}
        onMouseLeave={() => setCopyHover(false)}
      >
        {copied ? 'Copied!' : 'Copy Code'}
      </button>

      <div style={styles.participantReadout}>
        <span style={styles.participantCount}>{currentSession.user_count ?? 0}</span>
        <span style={styles.participantLabel}>
          {(currentSession.user_count ?? 0) === 1 ? 'participant' : 'participants'}<br />joined
        </span>
      </div>

      <p style={styles.info}>
        Share the code above with your group.
      </p>

      <p style={styles.joinedAs}>
        Logged in as: <strong style={{ color: COLORS.TEXT_PRIMARY }}>{currentUser.display_name}</strong>
        {currentUser.is_admin && <span style={{ color: COLORS.ACCENT }}> (Admin)</span>}
      </p>

      {currentUser.is_admin && <AdminPanel />}

      <div style={styles.stepsPanel}>
        <div style={styles.stepsTitle}>[ DELIBERATION SEQUENCE ]</div>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {csiSteps.map((text, i) => {
            const status = stepStatuses[i];
            const isCurrent = status === 'current';
            return (
              <motion.div
                key={i}
                variants={staggerItem}
                style={styles.step}
              >
                <div style={styles.stepLedWrap}>
                  <span style={statusLed(ledColorForStatus(status), isCurrent)} />
                </div>
                {isCurrent ? (
                  <motion.div
                    style={{
                      ...styles.stepText,
                      ...styles.stepTextActive,
                    }}
                    variants={pulseVariant}
                    animate="animate"
                  >
                    {text}
                  </motion.div>
                ) : (
                  <div
                    style={{
                      ...styles.stepText,
                      ...(status === 'done' ? styles.stepTextActive : {}),
                      ...(status === 'pending' ? { opacity: 0.5 } : {}),
                    }}
                  >
                    {text}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
