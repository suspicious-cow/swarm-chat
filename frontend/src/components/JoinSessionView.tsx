import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS, FONTS } from '../styles/constants';
import { instrumentCard, systemLabel, retroInput, statusLed, phosphorHeading } from '../styles/retro';
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

export function JoinSessionView() {
  const { account } = useAuthStore();
  const { joinSession, error } = useDeliberationStore();
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState(account?.display_name || '');
  const [joining, setJoining] = useState(false);
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
    <motion.div
      {...fadeIn}
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '28px',
      }}
    >
      {/* System label */}
      <div style={systemLabel}>[ FREQUENCY TUNING ]</div>

      {/* Heading */}
      <h2
        style={{
          ...phosphorHeading,
          fontSize: '24px',
          margin: 0,
        }}
      >
        JOIN MISSION
      </h2>

      {/* Join by code card */}
      <div
        style={{
          ...instrumentCard,
          padding: '28px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', flex: '0 0 180px' }}>
          <span
            style={{
              fontFamily: FONTS.MONO,
              fontSize: '11px',
              fontWeight: 500,
              color: COLORS.TEXT_MUTED,
              letterSpacing: '1.5px',
              textTransform: 'uppercase' as const,
            }}
          >
            Join Code
          </span>
          <input
            style={{
              ...retroInput,
              fontFamily: FONTS.MONO,
              fontSize: '18px',
              letterSpacing: '4px',
              textTransform: 'uppercase' as const,
              padding: '10px 14px',
            }}
            placeholder="A3X9K2"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT_DIM;
              e.currentTarget.style.boxShadow = `0 0 12px ${COLORS.ACCENT_GLOW}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', flex: 1 }}>
          <span
            style={{
              fontFamily: FONTS.MONO,
              fontSize: '11px',
              fontWeight: 500,
              color: COLORS.TEXT_MUTED,
              letterSpacing: '1.5px',
              textTransform: 'uppercase' as const,
            }}
          >
            Display Name
          </span>
          <input
            style={{
              ...retroInput,
              fontFamily: FONTS.BODY,
            }}
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT_DIM;
              e.currentTarget.style.boxShadow = `0 0 12px ${COLORS.ACCENT_GLOW}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <button
          style={{
            padding: '10px 24px',
            background: COLORS.TEAL,
            border: 'none',
            borderRadius: '2px',
            color: '#0a0a0f',
            fontFamily: FONTS.DISPLAY,
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase' as const,
            cursor: joining || !code.trim() || !displayName.trim() ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap' as const,
            height: '42px',
            transition: 'box-shadow 0.15s, opacity 0.15s',
            boxShadow: COLORS.SHADOW_TEAL,
            opacity: joining || !code.trim() || !displayName.trim() ? 0.5 : 1,
          }}
          onClick={handleJoin}
          disabled={joining || !code.trim() || !displayName.trim()}
        >
          {joining ? 'Joining...' : 'Join'}
        </button>
      </div>

      {error && (
        <p
          style={{
            fontFamily: FONTS.MONO,
            color: COLORS.ERROR,
            fontSize: '13px',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* Session list header */}
      <div style={systemLabel}>Your Sessions</div>

      {/* Session list with stagger */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '10px',
        }}
      >
        {loading ? (
          <p
            style={{
              fontFamily: FONTS.MONO,
              color: COLORS.TEXT_MUTED,
              fontSize: '13px',
              textAlign: 'center' as const,
              padding: '32px 0',
            }}
          >
            Loading...
          </p>
        ) : sessions.length === 0 ? (
          <p
            style={{
              fontFamily: FONTS.MONO,
              color: COLORS.TEXT_MUTED,
              fontSize: '13px',
              textAlign: 'center' as const,
              padding: '32px 0',
            }}
          >
            No sessions yet.
          </p>
        ) : (
          sessions.map((session) => {
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
                  padding: '16px 20px',
                  cursor: isCompleted ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                  opacity: isCompleted ? 0.6 : 1,
                  borderColor: isHovered && !isCompleted ? COLORS.TEAL_DIM : COLORS.BORDER,
                  boxShadow: isHovered && !isCompleted
                    ? `inset 0 1px 0 rgba(255,255,255,0.03), ${COLORS.SHADOW_TEAL}`
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
                        color: COLORS.TEXT_MUTED,
                      }}
                    >
                      {session.user_count ?? 0} participants &middot;{' '}
                      {formatDate(session.created_at)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontFamily: FONTS.MONO,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: COLORS.ACCENT,
                      letterSpacing: '2px',
                    }}
                  >
                    {session.join_code}
                  </span>
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
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
