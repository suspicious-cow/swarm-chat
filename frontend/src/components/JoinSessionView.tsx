import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS } from '../styles/constants';
import type { Session } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
  },
  joinCard: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '28px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: COLORS.TEXT_DIM,
  },
  input: {
    padding: '10px 14px',
    background: COLORS.BG_INPUT,
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    borderRadius: '8px',
    color: COLORS.TEXT_PRIMARY,
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  joinBtn: {
    padding: '10px 24px',
    background: COLORS.BUTTON,
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    height: '42px',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    color: COLORS.ERROR,
    fontSize: '13px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  sessionCard: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '10px',
    padding: '16px 20px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  sessionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: COLORS.TEXT_PRIMARY,
  },
  sessionMeta: {
    fontSize: '12px',
    color: COLORS.TEXT_DIM,
  },
  sessionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  joinCode: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.ACCENT,
    letterSpacing: '2px',
    fontFamily: 'monospace',
  },
  badge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  empty: {
    color: COLORS.TEXT_DIM,
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '32px 0',
  },
};

const badgeColors: Record<string, { background: string; color: string }> = {
  waiting: { background: '#3a3500', color: '#ffd644' },
  active: { background: '#003a1a', color: '#44ff88' },
  completed: { background: '#2a2a3a', color: '#8888bb' },
};

export function JoinSessionView() {
  const { account } = useAuthStore();
  const { joinSession, error } = useDeliberationStore();
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState(account?.display_name || '');
  const [joining, setJoining] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard/sessions`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data: Session[] = await res.json();
          setSessions(data);
        }
      } catch {
        // silent
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const handleJoin = async () => {
    if (!code.trim() || !displayName.trim() || joining) return;
    setJoining(true);
    await joinSession(code.trim(), displayName.trim());
    setJoining(false);
  };

  const handleSessionClick = (session: Session) => {
    if ((session.status === 'active' || session.status === 'waiting') && account) {
      joinSession(session.join_code, account.display_name);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Join a Session</h2>

      <div style={styles.joinCard}>
        <div style={{ ...styles.fieldGroup, flex: '0 0 160px' }}>
          <span style={styles.label}>Join code</span>
          <input
            style={{ ...styles.input, letterSpacing: '2px', textTransform: 'uppercase' }}
            placeholder="A3X9K2"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>
        <div style={{ ...styles.fieldGroup, flex: 1 }}>
          <span style={styles.label}>Display name</span>
          <input
            style={styles.input}
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>
        <button
          style={{
            ...styles.joinBtn,
            ...(joining || !code.trim() || !displayName.trim() ? styles.btnDisabled : {}),
          }}
          onClick={handleJoin}
          disabled={joining || !code.trim() || !displayName.trim()}
        >
          {joining ? 'Joining...' : 'Join'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <h3 style={styles.sectionTitle}>Your Sessions</h3>

      <div style={styles.sessionList}>
        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : sessions.length === 0 ? (
          <p style={styles.empty}>No sessions yet.</p>
        ) : (
          sessions.map((session) => {
            const colors = badgeColors[session.status] || badgeColors.completed;
            return (
              <div
                key={session.id}
                style={{
                  ...styles.sessionCard,
                  opacity: session.status === 'completed' ? 0.6 : 1,
                  cursor: session.status === 'completed' ? 'default' : 'pointer',
                }}
                onClick={() => handleSessionClick(session)}
              >
                <div style={styles.sessionInfo}>
                  <span style={styles.sessionTitle}>{session.title}</span>
                  <span style={styles.sessionMeta}>
                    {session.user_count ?? 0} participants &middot; {formatDate(session.created_at)}
                  </span>
                </div>
                <div style={styles.sessionRight}>
                  <span style={styles.joinCode}>{session.join_code}</span>
                  <span style={{ ...styles.badge, ...colors }}>
                    {session.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
