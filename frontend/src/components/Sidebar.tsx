import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { SwarmLogo } from './SwarmLogo';
import { LAYOUT, COLORS } from '../styles/constants';

type View = 'home' | 'new-session' | 'join-session' | 'settings'
  | 'waiting' | 'chat' | 'visualizer' | 'participants';

interface NavItem {
  label: string;
  view: View;
  icon: string;
}

const styles = {
  sidebar: {
    width: `${LAYOUT.SIDEBAR_WIDTH}px`,
    minWidth: `${LAYOUT.SIDEBAR_WIDTH}px`,
    background: COLORS.GRADIENT_SIDEBAR,
    borderRight: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    overflow: 'hidden',
  },
  brand: {
    padding: '20px 20px 16px',
    fontSize: '18px',
    fontWeight: 700,
    color: COLORS.ACCENT,
    borderBottom: `1px solid ${COLORS.BORDER}`,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '-0.3px',
  },
  nav: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 0',
  },
  navIcon: {
    fontSize: '16px',
    width: '22px',
    textAlign: 'center' as const,
    flexShrink: 0,
    opacity: 0.7,
  },
  navIconActive: {
    opacity: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px 10px 14px',
    fontSize: '13.5px',
    fontWeight: 500,
    color: COLORS.TEXT_MUTED,
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s ease',
    borderRadius: '0 6px 6px 0',
    margin: '1px 8px 1px 0',
  } as React.CSSProperties,
  navItemActive: {
    color: COLORS.TEXT_PRIMARY,
    background: COLORS.NAV_ACTIVE_BG,
    borderLeftColor: COLORS.NAV_ACTIVE_BORDER,
    fontWeight: 600,
  },
  divider: {
    height: '1px',
    background: COLORS.BORDER,
    margin: '8px 16px',
  },
  sessionInfo: {
    padding: '12px 20px',
    borderBottom: `1px solid ${COLORS.BORDER}`,
  },
  sessionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.TEXT_ACCENT,
    marginBottom: '4px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sessionCode: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  codeText: {
    fontSize: '13px',
    fontWeight: 600,
    color: COLORS.ACCENT,
    letterSpacing: '2px',
    fontFamily: 'monospace',
  },
  copyBtn: {
    background: 'none',
    border: `1px solid ${COLORS.BORDER_LIGHT}`,
    color: COLORS.TEXT_DIM,
    padding: '2px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'border-color 0.15s',
  },
  leaveBtn: {
    display: 'block',
    width: 'calc(100% - 32px)',
    margin: '8px 16px 16px',
    padding: '9px',
    background: 'rgba(248, 113, 113, 0.08)',
    border: `1px solid rgba(248, 113, 113, 0.2)`,
    borderRadius: '8px',
    color: COLORS.ERROR,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all 0.15s',
  },
};

export function Sidebar() {
  const { account } = useAuthStore();
  const { currentUser, currentSession, view, setView, reset } = useDeliberationStore();

  const inSession = !!(currentUser && currentSession &&
    (currentSession.status === 'waiting' || currentSession.status === 'active'));

  const handleCopy = () => {
    if (currentSession?.join_code) {
      navigator.clipboard.writeText(currentSession.join_code);
    }
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = view === item.view;
    return (
      <div
        key={item.view}
        style={{
          ...styles.navItem,
          ...(isActive ? styles.navItemActive : {}),
        }}
        onClick={() => setView(item.view)}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = COLORS.BG_HOVER;
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ ...styles.navIcon, ...(isActive ? styles.navIconActive : {}) }}>
          {item.icon}
        </span>
        {item.label}
      </div>
    );
  };

  const standardNav: NavItem[] = [
    { label: 'Home', view: 'home', icon: '\u2302' },
    { label: 'New Session', view: 'new-session', icon: '+' },
    { label: 'Join Session', view: 'join-session', icon: '\u2192' },
  ];

  const sessionNav: NavItem[] = [
    { label: 'Chat', view: 'chat', icon: '\u2709' },
    { label: 'Visualizer', view: 'visualizer', icon: '\u25C8' },
    { label: 'Participants', view: 'participants', icon: '\u2637' },
  ];

  if (!account) {
    return (
      <div style={styles.sidebar}>
        <div style={styles.brand}>
          <SwarmLogo size={28} />
          Swarm Chat
        </div>
      </div>
    );
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.brand}>
        <SwarmLogo size={28} />
        Swarm Chat
      </div>

      {inSession && currentSession && (
        <div style={styles.sessionInfo}>
          <div style={styles.sessionTitle}>{currentSession.title}</div>
          <div style={styles.sessionCode}>
            <span style={styles.codeText}>{currentSession.join_code}</span>
            <button style={styles.copyBtn} onClick={handleCopy}>Copy</button>
          </div>
        </div>
      )}

      <div style={styles.nav}>
        {inSession ? (
          <>
            {currentSession?.status === 'waiting' && renderNavItem({ label: 'Waiting Room', view: 'waiting', icon: '\u23F3' })}
            {currentSession?.status === 'active' && sessionNav.map(renderNavItem)}
            {currentUser?.is_admin && (
              <>
                <div style={styles.divider} />
                {renderNavItem({ label: 'Admin Controls', view: 'waiting', icon: '\u2699' })}
              </>
            )}
          </>
        ) : (
          <>
            {standardNav.map(renderNavItem)}
            <div style={styles.divider} />
            {renderNavItem({ label: 'Settings', view: 'settings', icon: '\u2699' })}
          </>
        )}
      </div>

      {inSession && (
        <button style={styles.leaveBtn} onClick={reset}>
          Leave Session
        </button>
      )}
    </div>
  );
}
