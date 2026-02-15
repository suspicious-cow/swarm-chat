import { useDeliberationStore } from '../stores/deliberationStore';
import { AdminPanel } from './AdminPanel';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
    paddingTop: '60px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#c0c0ff',
  },
  code: {
    fontSize: '48px',
    fontWeight: 800,
    color: '#7c8aff',
    letterSpacing: '8px',
  },
  info: {
    color: '#8888bb',
    fontSize: '14px',
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
  pulse: {
    width: '12px',
    height: '12px',
    background: '#4aff4a',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px',
    animation: 'pulse 2s infinite',
  },
  participantBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(124, 138, 255, 0.1)',
    border: '1px solid rgba(124, 138, 255, 0.25)',
    borderRadius: '12px',
    padding: '12px 24px',
  },
  participantCount: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#7c8aff',
  },
  participantLabel: {
    fontSize: '14px',
    color: '#8888bb',
  },
};

export function WaitingView() {
  const { currentSession, currentUser } = useDeliberationStore();

  if (!currentSession || !currentUser) return null;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <h2 style={styles.title}>{currentSession.title}</h2>

      <div style={styles.code}>{currentSession.join_code}</div>

      <div style={styles.participantBadge}>
        <span style={styles.participantCount}>{currentSession.user_count ?? 0}</span>
        <span style={styles.participantLabel}>
          {(currentSession.user_count ?? 0) === 1 ? 'participant' : 'participants'}<br />joined
        </span>
      </div>

      <p style={styles.info}>
        <span style={styles.pulse} />
        Waiting for participants to join...
        <br />
        Share the code above with your group.
      </p>

      <p style={styles.info}>
        You joined as: <strong>{currentUser.display_name}</strong>
        {currentUser.is_admin && ' (Admin)'}
      </p>

      {currentUser.is_admin && <AdminPanel />}
    </div>
  );
}
