import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS } from '../styles/constants';
import type { Session } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const styles = {
  container: {
    maxWidth: '840px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
    animation: 'fadeIn 0.3s ease',
  },
  hero: {
    background: COLORS.GRADIENT_HERO,
    borderRadius: '16px',
    border: `1px solid ${COLORS.BORDER}`,
    padding: '32px 32px 28px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute' as const,
    top: '-60px',
    right: '-40px',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  welcome: {
    fontSize: '26px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
    letterSpacing: '-0.3px',
    position: 'relative' as const,
  },
  subtitle: {
    fontSize: '14px',
    color: COLORS.TEXT_MUTED,
    marginTop: '8px',
    lineHeight: 1.7,
    maxWidth: '600px',
    position: 'relative' as const,
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    position: 'relative' as const,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '10px',
    padding: '12px 20px',
    textAlign: 'center' as const,
    minWidth: '100px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '11px',
    color: COLORS.TEXT_DIM,
    marginTop: '2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  actionCard: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '14px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: COLORS.SHADOW_SM,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  actionIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    marginBottom: '14px',
    fontWeight: 700,
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: COLORS.TEXT_HEADING,
    marginBottom: '6px',
  },
  actionDesc: {
    fontSize: '13px',
    color: COLORS.TEXT_DIM,
    lineHeight: 1.5,
  },
  actionArrow: {
    position: 'absolute' as const,
    right: '20px',
    top: '24px',
    fontSize: '18px',
    color: COLORS.TEXT_DIM,
    transition: 'all 0.2s ease',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: COLORS.TEXT_MUTED,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  viewAll: {
    fontSize: '13px',
    color: COLORS.ACCENT,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontWeight: 500,
    transition: 'opacity 0.15s',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sessionCard: {
    background: COLORS.BG_CARD,
    border: `1px solid ${COLORS.BORDER}`,
    borderRadius: '10px',
    padding: '14px 18px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
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
    letterSpacing: '0.3px',
  },
  empty: {
    color: COLORS.TEXT_DIM,
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '40px 0',
    background: COLORS.BG_CARD,
    borderRadius: '12px',
    border: `1px dashed ${COLORS.BORDER}`,
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
      {/* Hero welcome section */}
      <div style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.welcome}>Welcome back, {account?.display_name}</div>
        <p style={styles.subtitle}>
          Swarm Chat uses Conversational Swarm Intelligence to enable productive
          group deliberation at scale. Participants are split into small ThinkTanks
          connected by AI Surrogate Agents.
        </p>

        {sessions.length > 0 && (
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: COLORS.ACCENT }}>{sessions.length}</div>
              <div style={styles.statLabel}>Sessions</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: COLORS.SUCCESS }}>{activeSessions}</div>
              <div style={styles.statLabel}>Active</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statNumber, color: COLORS.ACCENT_TERTIARY }}>{totalParticipants}</div>
              <div style={styles.statLabel}>Participants</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick action cards */}
      <div style={styles.quickActions}>
        <div
          style={styles.actionCard}
          onClick={() => setView('new-session')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = COLORS.SHADOW_MD;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
          }}
        >
          <div style={styles.actionArrow}>{'\u2192'}</div>
          <div style={{
            ...styles.actionIconWrap,
            background: 'rgba(245, 158, 11, 0.12)',
            color: COLORS.ACCENT,
          }}>
            +
          </div>
          <div style={styles.actionTitle}>Create a Session</div>
          <div style={styles.actionDesc}>
            Start a new deliberation on any topic and invite participants to join.
          </div>
        </div>
        <div
          style={styles.actionCard}
          onClick={() => setView('join-session')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT_TERTIARY;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = COLORS.SHADOW_MD;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = COLORS.SHADOW_SM;
          }}
        >
          <div style={styles.actionArrow}>{'\u2192'}</div>
          <div style={{
            ...styles.actionIconWrap,
            background: 'rgba(20, 184, 166, 0.12)',
            color: COLORS.ACCENT_TERTIARY,
          }}>
            {'\u2192'}
          </div>
          <div style={styles.actionTitle}>Join a Session</div>
          <div style={styles.actionDesc}>
            Enter a join code to participate in an existing deliberation.
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Recent Sessions</span>
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
            <div style={styles.empty}>
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>{'\u2B22'}</div>
              No sessions yet. Create your first session to get started!
            </div>
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
                  onMouseEnter={(e) => {
                    if (session.status !== 'completed') {
                      e.currentTarget.style.borderColor = COLORS.BORDER_LIGHT;
                      e.currentTarget.style.background = COLORS.BG_ELEVATED;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = COLORS.BORDER;
                    e.currentTarget.style.background = COLORS.BG_CARD;
                  }}
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
