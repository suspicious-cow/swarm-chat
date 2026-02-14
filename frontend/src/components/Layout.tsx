import type { ReactNode } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f0f23',
    color: '#e0e0e0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: '#1a1a3e',
    borderBottom: '1px solid #2a2a5a',
  } as React.CSSProperties,
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#7c8aff',
    margin: 0,
  } as React.CSSProperties,
  nav: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  } as React.CSSProperties,
  navBtn: {
    background: 'none',
    border: '1px solid #3a3a6a',
    color: '#a0a0d0',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  } as React.CSSProperties,
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  } as React.CSSProperties,
};

export function Layout({ children }: { children: ReactNode }) {
  const { currentSession, currentUser, view, setView, reset } = useDeliberationStore();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Swarm Chat</h1>
        <div style={styles.nav}>
          {currentSession && (
            <span style={{ color: '#6a6a9a', fontSize: '13px' }}>
              {currentSession.title} ({currentSession.status})
              {currentSession.join_code && ` | Code: ${currentSession.join_code}`}
            </span>
          )}
          {currentUser && view === 'chat' && (
            <button style={styles.navBtn} onClick={() => setView('visualizer')}>
              Visualizer
            </button>
          )}
          {currentUser && view === 'visualizer' && (
            <button style={styles.navBtn} onClick={() => setView('chat')}>
              Chat
            </button>
          )}
          {currentSession && (
            <button
              style={{ ...styles.navBtn, borderColor: '#5a3a3a', color: '#d08080' }}
              onClick={reset}
            >
              Leave
            </button>
          )}
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </div>
  );
}
