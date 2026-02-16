import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { useThemeStore } from '../stores/themeStore';
import { Sidebar } from './Sidebar';
import { ToastContainer } from './ToastContainer';
import { LAYOUT, COLORS, FONTS, DARK_THEME, LIGHT_THEME, themeToCSS } from '../styles/constants';
import { scanLineOverlay, crtVignette, gridBg } from '../styles/retro';
import { viewTransition } from '../styles/motion';

const styles = {
  root: {
    display: 'flex',
    height: '100vh',
    background: COLORS.BG_PRIMARY,
    color: COLORS.TEXT_PRIMARY,
    fontFamily: FONTS.BODY,
    position: 'relative' as const,
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
    boxShadow: COLORS.SHADOW_SM,
  } as React.CSSProperties,
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 12px',
    background: COLORS.BG_HOVER,
    borderRadius: '20px',
    fontSize: '18px',
    fontFamily: FONTS.BODY,
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
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: FONTS.DISPLAY,
    color: '#fff',
  },
  logoutBtn: {
    background: 'transparent',
    border: `1px solid ${COLORS.BORDER}`,
    color: COLORS.TEXT_MUTED,
    padding: '5px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontFamily: FONTS.BODY,
    transition: 'all 0.15s',
  },
  themeToggle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'transparent',
    border: `1px solid ${COLORS.BORDER}`,
    color: COLORS.ACCENT,
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
  } as React.CSSProperties,
  main: {
    flex: 1,
    overflow: 'auto',
    padding: `${LAYOUT.CONTENT_PADDING}px`,
    ...gridBg,
  } as React.CSSProperties,
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
    0%, 100% { box-shadow: 0 0 8px rgba(255,184,0,0.2); }
    50% { box-shadow: 0 0 20px rgba(255,184,0,0.4); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes ledPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.BORDER}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${COLORS.BORDER_LIGHT}; }

  /* Selection */
  ::selection { background: rgba(255, 184, 0, 0.25); color: #fff; }

  /* Focus ring */
  :focus-visible { outline: 2px solid ${COLORS.ACCENT}; outline-offset: 2px; }
  input:focus-visible, button:focus-visible { outline-offset: 0; }
`;

export function Layout({ children }: { children: ReactNode }) {
  const { account, logout } = useAuthStore();
  const { view, reset } = useDeliberationStore();
  const { mode, toggle } = useThemeStore();

  const handleLogout = () => {
    logout();
    reset();
  };

  const themeVars = themeToCSS(mode === 'dark' ? DARK_THEME : LIGHT_THEME);

  return (
    <div style={styles.root}>
      <style>{`:root { ${themeVars} }`}</style>
      <style>{globalKeyframes}</style>

      {/* Scan lines overlay */}
      <div style={scanLineOverlay} />

      {/* CRT vignette overlay */}
      <div style={crtVignette} />

      <Sidebar />
      <div style={styles.rightPanel}>
        <div style={styles.topBar}>
          <button
            style={styles.themeToggle}
            onClick={toggle}
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT;
              e.currentTarget.style.boxShadow = COLORS.SHADOW_GLOW;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {mode === 'dark' ? '\u2600' : '\u263D'}
          </button>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={viewTransition.initial}
              animate={viewTransition.animate}
              exit={viewTransition.exit}
              transition={viewTransition.transition}
              style={{ height: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
