import { useEffect } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';
import { COLORS } from '../styles/constants';

const groupColors = [
  { bg: '#1a2a4a', border: '#2a4a6a' },
  { bg: '#2a1a4a', border: '#4a2a6a' },
  { bg: '#1a3a3a', border: '#2a5a5a' },
  { bg: '#3a2a1a', border: '#5a4a2a' },
  { bg: '#1a3a1a', border: '#2a5a2a' },
  { bg: '#3a1a3a', border: '#5a2a5a' },
];

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: COLORS.TEXT_HEADING,
  },
  meta: {
    fontSize: '13px',
    color: COLORS.TEXT_DIM,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  card: {
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid',
  },
  cardHighlighted: {
    boxShadow: `0 0 0 2px ${COLORS.ACCENT}`,
  },
  cardLabel: {
    fontSize: '15px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '4px',
  },
  cardCount: {
    fontSize: '12px',
    color: COLORS.TEXT_DIM,
    marginBottom: '12px',
  },
  member: {
    padding: '6px 0',
    fontSize: '13px',
    color: COLORS.TEXT_PRIMARY,
    borderBottom: `1px solid rgba(255,255,255,0.05)`,
  },
  youBadge: {
    fontSize: '11px',
    color: COLORS.ACCENT,
    marginLeft: '6px',
    fontWeight: 500,
  },
  empty: {
    color: COLORS.TEXT_DIM,
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '40px 0',
  },
};

export function ParticipantsView() {
  const { currentUser, currentSession, subgroups, fetchSubgroups } = useDeliberationStore();

  useEffect(() => {
    fetchSubgroups();
  }, []);

  if (!currentSession) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Participants</h2>
        <span style={styles.meta}>
          {subgroups.length} ThinkTanks &middot; {subgroups.reduce((sum, sg) => sum + (sg.members?.length || 0), 0)} participants
        </span>
      </div>

      {subgroups.length === 0 ? (
        <p style={styles.empty}>
          ThinkTanks will appear here once the deliberation starts.
        </p>
      ) : (
        <div style={styles.grid}>
          {subgroups.map((sg, i) => {
            const color = groupColors[i % groupColors.length];
            const isMyGroup = sg.id === currentUser?.subgroup_id;
            return (
              <div
                key={sg.id}
                style={{
                  ...styles.card,
                  background: color.bg,
                  borderColor: color.border,
                  ...(isMyGroup ? styles.cardHighlighted : {}),
                }}
              >
                <div style={styles.cardLabel}>
                  {sg.label}
                  {isMyGroup && <span style={styles.youBadge}> (Your group)</span>}
                </div>
                <div style={styles.cardCount}>
                  {sg.members?.length || 0} members
                </div>
                {sg.members?.map((member) => (
                  <div key={member.id} style={styles.member}>
                    {member.display_name}
                    {member.id === currentUser?.id && (
                      <span style={styles.youBadge}>you</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
