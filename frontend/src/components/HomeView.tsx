import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, dataReadout, statusLed, retroButton } from '../styles/retro';
import { staggerContainer, staggerItem, fadeIn } from '../styles/motion';
import type { Session } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const badgeColors: Record<string, { background: string; color: string }> = {
  waiting: { background: COLORS.BADGE_WAITING_BG, color: COLORS.BADGE_WAITING_TEXT },
  active: { background: COLORS.BADGE_ACTIVE_BG, color: COLORS.BADGE_ACTIVE_TEXT },
  completed: { background: COLORS.BADGE_COMPLETED_BG, color: COLORS.BADGE_COMPLETED_TEXT },
};

const statusLedColor: Record<string, string> = {
  active: COLORS.SUCCESS,
  waiting: COLORS.ACCENT,
  completed: COLORS.TEXT_DIM,
};

export function HomeView() {
  const { account } = useAuthStore();
  const { setView, joinSession } = useDeliberationStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
    <motion.div
      {...fadeIn}
      style={{
        maxWidth: '840px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '28px',
      }}
    >
      {/* System label */}
      <div style={systemLabel}>[ MISSION CONTROL ]</div>

      {/* Heading */}
      <h1
        style={{
          fontFamily: FONTS.DISPLAY,
          fontSize: '28px',
          fontWeight: 700,
          color: COLORS.TEXT_HEADING,
          letterSpacing: '2px',
          textTransform: 'uppercase' as const,
          margin: 0,
        }}
      >
        COMMAND CENTER
      </h1>

      {/* Welcome + subtitle */}
      <p
        style={{
          fontFamily: FONTS.BODY,
          fontSize: '14px',
          color: COLORS.TEXT_MUTED,
          lineHeight: 1.7,
          maxWidth: '600px',
          margin: 0,
        }}
      >
        Welcome back, {account?.display_name}. Swarm Chat uses Conversational Swarm
        Intelligence to enable productive group deliberation at scale.
      </p>

      {/* Stats readouts */}
      {sessions.length > 0 && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ ...dataReadout, textAlign: 'center' as const, minWidth: '110px' }}>
            <div
              style={{
                fontFamily: FONTS.MONO,
                fontSize: '24px',
                fontWeight: 700,
                color: COLORS.ACCENT,
                lineHeight: 1.2,
              }}
            >
              {sessions.length}
            </div>
            <div
              style={{
                fontFamily: FONTS.MONO,
                fontSize: '10px',
                color: COLORS.TEXT_DIM,
                marginTop: '4px',
                textTransform: 'uppercase' as const,
                letterSpacing: '1.5px',
              }}
            >
              Sessions
            </div>
          </div>
          <div style={{ ...dataReadout, textAlign: 'center' as const, minWidth: '110px' }}>
            <div
              style={{
                fontFamily: FONTS.MONO,
                fontSize: '24px',
                fontWeight: 700,
                color: COLORS.SUCCESS,
                lineHeight: 1.2,
              }}
            >
              {activeSessions}
            </div>
            <div
              style={{
                fontFamily: FONTS.MONO,
                fontSize: '10px',
                color: COLORS.TEXT_DIM,
                marginTop: '4px',
                textTransform: 'uppercase' as const,
                letterSpacing: '1.5px',
              }}
            >
              Active
            </div>
          </div>
          <div style={{ ...dataReadout, textAlign: 'center' as const, minWidth: '110px' }}>
            <div
              style={{
                fontFamily: FONTS.MONO,
                fontSize: '24px',
                fontWeight: 700,
                color: COLORS.TEAL,
                lineHeight: 1.2,
              }}
            >
              {totalParticipants}
            </div>
            <div
              style={{
                fontFamily: FONTS.MONO,
                fontSize: '10px',
                color: COLORS.TEXT_DIM,
                marginTop: '4px',
                textTransform: 'uppercase' as const,
                letterSpacing: '1.5px',
              }}
            >
              Participants
            </div>
          </div>
        </div>
      )}

      {/* Quick action cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div
          style={{
            ...instrumentCard,
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative' as const,
            overflow: 'hidden',
          }}
          onClick={() => setView('new-session')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT;
            e.currentTarget.style.boxShadow = COLORS.SHADOW_GLOW;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_SM}`;
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '14px',
              background: COLORS.ACCENT_GLOW,
              color: COLORS.ACCENT,
              fontFamily: FONTS.MONO,
            }}
          >
            +
          </div>
          <div
            style={{
              fontFamily: FONTS.DISPLAY,
              fontSize: '16px',
              fontWeight: 600,
              color: COLORS.TEXT_HEADING,
              marginBottom: '6px',
              letterSpacing: '0.5px',
            }}
          >
            Create a Session
          </div>
          <div
            style={{
              fontFamily: FONTS.BODY,
              fontSize: '13px',
              color: COLORS.TEXT_DIM,
              lineHeight: 1.5,
            }}
          >
            Start a new deliberation on any topic and invite participants to join.
          </div>
        </div>

        <div
          style={{
            ...instrumentCard,
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            position: 'relative' as const,
            overflow: 'hidden',
          }}
          onClick={() => setView('join-session')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.TEAL;
            e.currentTarget.style.boxShadow = COLORS.SHADOW_TEAL;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_SM}`;
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '14px',
              background: COLORS.TEAL_GLOW,
              color: COLORS.TEAL,
              fontFamily: FONTS.MONO,
            }}
          >
            {'>'}
          </div>
          <div
            style={{
              fontFamily: FONTS.DISPLAY,
              fontSize: '16px',
              fontWeight: 600,
              color: COLORS.TEXT_HEADING,
              marginBottom: '6px',
              letterSpacing: '0.5px',
            }}
          >
            Join a Session
          </div>
          <div
            style={{
              fontFamily: FONTS.BODY,
              fontSize: '13px',
              color: COLORS.TEXT_DIM,
              lineHeight: 1.5,
            }}
          >
            Enter a join code to participate in an existing deliberation.
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={systemLabel}>Recent Sessions</span>
          {sessions.length > 5 && (
            <button
              style={{
                ...retroButton,
                padding: '6px 16px',
                fontSize: '11px',
                background: 'transparent',
                border: `1px solid ${COLORS.BORDER_LIGHT}`,
                color: COLORS.ACCENT,
              }}
              onClick={() => setView('join-session')}
            >
              View All
            </button>
          )}
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px',
            marginTop: '12px',
          }}
        >
          {loading ? (
            <p
              style={{
                fontFamily: FONTS.MONO,
                color: COLORS.TEXT_DIM,
                fontSize: '13px',
                textAlign: 'center' as const,
                padding: '40px 0',
              }}
            >
              Loading...
            </p>
          ) : recentSessions.length === 0 ? (
            <div
              style={{
                ...instrumentCard,
                padding: '40px',
                textAlign: 'center' as const,
                fontFamily: FONTS.BODY,
                color: COLORS.TEXT_DIM,
                fontSize: '14px',
                borderStyle: 'dashed',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>
                {'\u2B22'}
              </div>
              No sessions yet. Create your first session to get started!
            </div>
          ) : (
            recentSessions.map((session) => {
              const colors = badgeColors[session.status] || badgeColors.completed;
              const ledColor = statusLedColor[session.status] || COLORS.TEXT_DIM;
              const isHovered = hoveredCard === session.id;
              const isCompleted = session.status === 'completed';

              return (
                <motion.div
                  key={session.id}
                  variants={staggerItem}
                  style={{
                    ...instrumentCard,
                    padding: '14px 18px',
                    cursor: isCompleted ? 'default' : 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    opacity: isCompleted ? 0.6 : 1,
                    borderColor: isHovered && !isCompleted ? COLORS.ACCENT_DIM : COLORS.BORDER,
                    boxShadow: isHovered && !isCompleted
                      ? `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_GLOW}`
                      : `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_SM}`,
                  }}
                  onClick={() => handleSessionClick(session)}
                  onMouseEnter={() => setHoveredCard(session.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={statusLed(ledColor, session.status === 'active')} />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column' as const,
                        gap: '2px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.BODY,
                          fontSize: '14px',
                          fontWeight: 600,
                          color: COLORS.TEXT_PRIMARY,
                        }}
                      >
                        {session.title}
                      </span>
                      <span
                        style={{
                          fontFamily: FONTS.MONO,
                          fontSize: '11px',
                          color: COLORS.TEXT_DIM,
                        }}
                      >
                        {session.user_count ?? 0} participants &middot;{' '}
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontWeight: 600,
                      fontFamily: FONTS.MONO,
                      textTransform: 'uppercase' as const,
                      letterSpacing: '1px',
                      ...colors,
                    }}
                  >
                    {session.status}
                  </span>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
