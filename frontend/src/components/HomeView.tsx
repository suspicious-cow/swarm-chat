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
    animation: 'fadeIn 0.3s ease',
  },
  welcome: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
  },
  subtitle: {
    fontSize: '14px',
    color: COLORS.TEXT_MUTED,
    marginTop: '4px',
    lineHeight: 1.6,
  },
  quickActions: {
    display: 'flex',
    gap: '16px',
  },
  actionCard: {
    flex: 1,
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '8px',
  },
  actionDesc: {
    fontSize: '13px',
    color: COLORS.TEXT_DIM,
    lineHeight: 1.5,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: '13px',
    color: COLORS.ACCENT,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontWeight: 500,
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
  waiting: { background: COLORS.BADGE_WAITING_BG, color: COLORS.BADGE_WAITING_TEXT },
  active: { background: COLORS.BADGE_ACTIVE_BG, color: COLORS.BADGE_ACTIVE_TEXT },
  completed: { background: COLORS.BADGE_COMPLETED_BG, color: COLORS.BADGE_COMPLETED_TEXT },
};

export function HomeView() {
  const { account } = useAuthStore();
  const { setView, joinSession } = useDeliberationStore();
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

  const handleSessionClick = (session: Session) => {
    if ((session.status === 'active' || session.status === 'waiting') && account) {
      joinSession(session.join_code, account.display_name);
    }
  };

  const recentSessions = sessions.slice(0, 5);
  const activeSessions = sessions.filter((s) => s.status === 'active').length;
  const totalParticipants = sessions.reduce((sum, s) => sum + (s.user_count ?? 0), 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <div>
        <div style={styles.welcome}>Welcome, {account?.display_name}</div>
        <p style={styles.subtitle}>
          Swarm Chat uses Conversational Swarm Intelligence to enable productive
          group deliberation at scale. Participants are split into small ThinkTanks
          connected by AI Surrogate Agents.
        </p>
      </div>

      {sessions.length > 0 && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            ...styles.actionCard,
            cursor: 'default',
            flex: 'none',
            width: '120px',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.ACCENT }}>{sessions.length}</div>
            <div style={{ fontSize: '12px', color: COLORS.TEXT_DIM }}>Sessions</div>
          </div>
          <div style={{
            ...styles.actionCard,
            cursor: 'default',
            flex: 'none',
            width: '120px',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.SUCCESS }}>{activeSessions}</div>
            <div style={{ fontSize: '12px', color: COLORS.TEXT_DIM }}>Active</div>
          </div>
          <div style={{
            ...styles.actionCard,
            cursor: 'default',
            flex: 'none',
            width: '120px',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: COLORS.WARNING }}>{totalParticipants}</div>
            <div style={{ fontSize: '12px', color: COLORS.TEXT_DIM }}>Participants</div>
          </div>
        </div>
      )}

      <div style={styles.quickActions}>
        <div
          style={styles.actionCard}
          onClick={() => setView('new-session')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.ACCENT; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.BORDER; }}
        >
          <div style={styles.actionTitle}>Create a Session</div>
          <div style={styles.actionDesc}>
            Start a new deliberation on any topic and invite participants.
          </div>
        </div>
        <div
          style={styles.actionCard}
          onClick={() => setView('join-session')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.ACCENT; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.BORDER; }}
        >
          <div style={styles.actionTitle}>Join a Session</div>
          <div style={styles.actionDesc}>
            Enter a join code to participate in an existing deliberation.
          </div>
        </div>
      </div>

      <div>
        <div style={styles.sectionTitle}>
          <span>Recent Sessions</span>
          {sessions.length > 5 && (
            <button style={styles.viewAll} onClick={() => setView('join-session')}>
              View All
            </button>
          )}
        </div>

        <div style={{ ...styles.sessionList, marginTop: '12px' }}>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : recentSessions.length === 0 ? (
            <p style={styles.empty}>No sessions yet. Create your first session to get started!</p>
          ) : (
            recentSessions.map((session) => {
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
                  <span style={{ ...styles.badge, ...colors }}>{session.status}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
