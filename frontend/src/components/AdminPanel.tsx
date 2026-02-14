import { useState } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';

const styles = {
  panel: {
    background: '#1a1a3e',
    border: '1px solid #3a3a5a',
    borderRadius: '12px',
    padding: '24px',
    width: '400px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#c0c0ff',
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
  },
  startBtn: {
    background: '#2a8a2a',
    color: '#fff',
  },
  stopBtn: {
    background: '#8a2a2a',
    color: '#fff',
  },
  summaryBtn: {
    background: '#3a3a8a',
    color: '#fff',
  },
  info: {
    color: '#6a6a9a',
    fontSize: '13px',
    marginBottom: '12px',
  },
  summary: {
    background: '#0f0f23',
    border: '1px solid #2a2a5a',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '12px',
    color: '#c0c0e0',
    fontSize: '14px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
  },
  error: {
    color: '#ff6b6b',
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
