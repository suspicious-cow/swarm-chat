import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { Sidebar } from './Sidebar';
import { ToastContainer } from './ToastContainer';
import { LAYOUT, COLORS } from '../styles/constants';

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    background: COLORS.BG_PRIMARY,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: 0,
  },
  topBar: {
    height: `${LAYOUT.TOP_BAR_HEIGHT}px`,
    minHeight: `${LAYOUT.TOP_BAR_HEIGHT}px`,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0 24px',
    background: COLORS.BG_CARD,
    borderBottom: `1px solid ${COLORS.BORDER}`,
    gap: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
  } as React.CSSProperties,
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    background: COLORS.BG_HOVER,
    borderRadius: '20px',
    fontSize: '13px',
    color: COLORS.TEXT_PRIMARY,
  },
  userAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: COLORS.GRADIENT_PRIMARY,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    color: '#fff',
  },
  logoutBtn: {
    background: 'transparent',
    border: `1px solid ${COLORS.BORDER}`,
    color: COLORS.TEXT_MUTED,
    padding: '5px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.15s',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: `${LAYOUT.CONTENT_PADDING}px`,
  },
};

const globalKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 8px rgba(245,158,11,0.2); }
    50% { box-shadow: 0 0 20px rgba(245,158,11,0.4); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.BORDER}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${COLORS.BORDER_LIGHT}; }

  /* Selection */
  ::selection { background: rgba(245, 158, 11, 0.25); color: #fff; }

  /* Focus ring */
  :focus-visible { outline: 2px solid ${COLORS.ACCENT}; outline-offset: 2px; }
  input:focus-visible, button:focus-visible { outline-offset: 0; }
`;

export function Layout({ children }: { children: ReactNode }) {
  const { account, logout } = useAuthStore();
  const { reset } = useDeliberationStore();

  const handleLogout = () => {
    logout();
    reset();
  };

  return (
    <div style={styles.root}>
      <style>{globalKeyframes}</style>
      <Sidebar />
      <div style={styles.rightPanel}>
        <div style={styles.topBar}>
          {account && (
            <>
              <div style={styles.userChip}>
                <div style={styles.userAvatar}>
                  {account.display_name.charAt(0).toUpperCase()}
                </div>
                {account.display_name}
              </div>
              <button
                style={styles.logoutBtn}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.ERROR;
                  e.currentTarget.style.color = COLORS.ERROR;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.BORDER;
                  e.currentTarget.style.color = COLORS.TEXT_MUTED;
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
        <main style={styles.main}>
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
