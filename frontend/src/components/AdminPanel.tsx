import { useState } from 'react';
import { motion } from 'motion/react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, statusLed, retroButton } from '../styles/retro';
import { fadeIn } from '../styles/motion';

const API_BASE = import.meta.env.VITE_API_URL || '';

const styles = {
  panel: {
    ...instrumentCard,
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
  } as React.CSSProperties,
  sectionLabel: {
    ...systemLabel,
    marginBottom: '18px',
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  infoLabel: {
    fontFamily: FONTS.MONO,
    fontSize: '11px',
    color: COLORS.TEXT_DIM,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  infoValue: {
    ...dataReadout,
    padding: '4px 10px',
    fontSize: '12px',
  } as React.CSSProperties,
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  statusText: {
    fontFamily: FONTS.MONO,
    fontSize: '12px',
    color: COLORS.TEXT_PRIMARY,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '16px',
  },
  actionBtn: {
    ...retroButton,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px 24px',
    fontSize: '14px',
  } as React.CSSProperties,
  startBtn: {
    background: 'linear-gradient(135deg, #00CC66, #00FF88)',
    color: '#0a0a0f',
    boxShadow: '0 0 20px rgba(0,255,136,0.15)',
  },
  stopBtn: {
    background: 'linear-gradient(135deg, #CC3333, #FF4444)',
    color: '#fff',
    boxShadow: '0 0 20px rgba(255,68,68,0.15)',
  },
  summaryBtn: {
    background: 'linear-gradient(135deg, #00A888, #00D4AA)',
    color: '#0a0a0f',
    boxShadow: '0 0 20px rgba(0,212,170,0.15)',
  },
  summary: {
    ...dataReadout,
    marginTop: '16px',
    fontSize: '13px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
    color: COLORS.TEXT_PRIMARY,
    background: COLORS.BG_INPUT,
    padding: '16px',
  } as React.CSSProperties,
  error: {
    fontFamily: FONTS.MONO,
    color: COLORS.ERROR,
    fontSize: '12px',
    marginTop: '8px',
    letterSpacing: '0.5px',
  },
};

function getStatusLedColor(status: string): string {
  if (status === 'active') return COLORS.SUCCESS;
  if (status === 'waiting') return COLORS.ACCENT;
  return COLORS.TEXT_DIM;
}

export function AdminPanel() {
  const { currentSession, startSession, stopSession, error } = useDeliberationStore();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  if (!currentSession) return null;

  const handleSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/${currentSession.id}/summary`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary('Failed to generate summary.');
    }
    setLoading(false);
  };

  const hoverGlowStyle = (btnKey: string, glowColor: string): React.CSSProperties =>
    hoveredBtn === btnKey ? { boxShadow: `0 0 28px ${glowColor}`, transform: 'translateY(-1px)' } : {};

  return (
    <motion.div style={styles.panel} {...fadeIn}>
      <style>{`
        @keyframes ledPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
        }
      `}</style>

      <div style={styles.sectionLabel}>[ COMMAND AUTHORITY ]</div>

      <div style={styles.infoRow}>
        <span style={styles.infoLabel}>Session</span>
        <span style={styles.infoValue}>{currentSession.title}</span>
      </div>

      <div style={styles.statusRow}>
        <span style={statusLed(getStatusLedColor(currentSession.status), currentSession.status === 'active')} />
        <span style={styles.statusText}>{currentSession.status}</span>
      </div>

      <div style={styles.buttonGroup}>
        {currentSession.status === 'waiting' && (
          <button
            style={{
              ...styles.actionBtn,
              ...styles.startBtn,
              ...hoverGlowStyle('start', 'rgba(0,255,136,0.35)'),
            }}
            onClick={startSession}
            onMouseEnter={() => setHoveredBtn('start')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <span style={statusLed(COLORS.SUCCESS)} />
            LAUNCH
          </button>
        )}

        {currentSession.status === 'active' && (
          <button
            style={{
              ...styles.actionBtn,
              ...styles.stopBtn,
              ...hoverGlowStyle('stop', 'rgba(255,68,68,0.35)'),
            }}
            onClick={stopSession}
            onMouseEnter={() => setHoveredBtn('stop')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <span style={statusLed(COLORS.ERROR)} />
            TERMINATE
          </button>
        )}

        {(currentSession.status === 'active' || currentSession.status === 'completed') && (
          <button
            style={{
              ...styles.actionBtn,
              ...styles.summaryBtn,
              ...hoverGlowStyle('summary', 'rgba(0,212,170,0.35)'),
              ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            onClick={handleSummary}
            disabled={loading}
            onMouseEnter={() => setHoveredBtn('summary')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <span style={statusLed(COLORS.TEAL)} />
            {loading ? 'GENERATING...' : 'DEBRIEF'}
          </button>
        )}
      </div>

      {error && <p style={styles.error}>&gt; ERROR: {error}</p>}

      {summary && (
        <motion.div style={styles.summary} {...fadeIn}>
          {summary}
        </motion.div>
      )}
    </motion.div>
  );
}
