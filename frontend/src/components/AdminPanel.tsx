import { useState } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS } from '../styles/constants';

const styles = {
  panel: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '16px',
  },
  btn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginBottom: '8px',
    transition: 'opacity 0.15s',
  },
  startBtn: {
    background: COLORS.SUCCESS,
    color: '#fff',
  },
  stopBtn: {
    background: COLORS.ERROR,
    color: '#fff',
  },
  summaryBtn: {
    background: COLORS.BUTTON,
    color: '#fff',
  },
  info: {
    color: COLORS.TEXT_DIM,
    fontSize: '13px',
    marginBottom: '12px',
  },
  summary: {
    background: COLORS.BG_INPUT,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '8px',
    padding: '16px',
    marginTop: '12px',
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
  },
  error: {
    color: COLORS.ERROR,
    fontSize: '13px',
    marginTop: '8px',
  },
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AdminPanel() {
  const { currentSession, startSession, stopSession, error } = useDeliberationStore();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Admin Controls</h3>
      <p style={styles.info}>
        Session: {currentSession.title}<br />
        Status: {currentSession.status}
      </p>

      {currentSession.status === 'waiting' && (
        <button
          style={{ ...styles.btn, ...styles.startBtn }}
          onClick={startSession}
        >
          Start Deliberation
        </button>
      )}

      {currentSession.status === 'active' && (
        <button
          style={{ ...styles.btn, ...styles.stopBtn }}
          onClick={stopSession}
        >
          End Deliberation
        </button>
      )}

      {currentSession.status === 'active' || currentSession.status === 'completed' ? (
        <button
          style={{ ...styles.btn, ...styles.summaryBtn }}
          onClick={handleSummary}
          disabled={loading}
        >
          {loading ? 'Generating Summary...' : 'Generate Summary'}
        </button>
      ) : null}

      {error && <p style={styles.error}>{error}</p>}
      {summary && <div style={styles.summary}>{summary}</div>}
    </div>
  );
}
