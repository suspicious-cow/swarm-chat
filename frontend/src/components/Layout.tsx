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
    gap: '16px',
  } as React.CSSProperties,
  userInfo: {
    fontSize: '13px',
    color: COLORS.TEXT_MUTED,
  },
  logoutBtn: {
    background: 'none',
    border: `1px solid #5a3a3a`,
    color: '#d08080',
    padding: '5px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: `${LAYOUT.CONTENT_PADDING}px`,
  },
};

export function Layout({ children }: { children: ReactNode }) {
  const { account, logout } = useAuthStore();
  const { reset } = useDeliberationStore();

  const handleLogout = () => {
    logout();
    reset();
  };

  return (
    <div style={styles.root}>
      <Sidebar />
      <div style={styles.rightPanel}>
        <div style={styles.topBar}>
          {account && (
            <>
              <span style={styles.userInfo}>{account.display_name}</span>
              <button style={styles.logoutBtn} onClick={handleLogout}>
                Logout
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
