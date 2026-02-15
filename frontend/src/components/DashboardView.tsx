import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useDeliberationStore } from '../stores/deliberationStore';
import { InviteCodeManager } from './InviteCodeManager';
import { MfaSettingsPanel } from './MfaSettingsPanel';
import type { Session } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '32px',
    paddingTop: '40px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  welcome: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#e0e0ff',
  },
  logoutBtn: {
    padding: '8px 20px',
    background: 'transparent',
    border: '1px solid #3a3a6a',
    borderRadius: '8px',
    color: '#8888bb',
    fontSize: '13px',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: '16px',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    padding: '14px',
    background: '#4a4aff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#c0c0ff',
    width: '100%',
    marginBottom: '-16px',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
  },
  sessionCard: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    borderRadius: '12px',
    padding: '20px 24px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  sessionTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#e0e0e0',
  },
  sessionMeta: {
    fontSize: '12px',
    color: '#6a6a9a',
  },
  sessionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  joinCode: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#7c8aff',
    letterSpacing: '2px',
  },
  badge: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  empty: {
    color: '#6a6a9a',
    fontSize: '14px',
    textAlign: 'center' as const,
    padding: '40px 0',
  },
};

const badgeColors: Record<string, { background: string; color: string }> = {
  waiting: { background: '#3a3500', color: '#ffd644' },
  active: { background: '#003a1a', color: '#44ff88' },
  completed: { background: '#2a2a3a', color: '#8888bb' },
};

export function DashboardView() {
  const { account, logout } = useAuthStore();
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
      } catch (_) {
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.welcome}>Welcome, {account?.display_name}</span>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>

      <div style={styles.actions}>
        <button style={styles.actionBtn} onClick={() => setView('lobby')}>
          New Session
        </button>
        <button style={styles.actionBtn} onClick={() => setView('lobby')}>
          Join Session
        </button>
      </div>

      <h3 style={styles.sectionTitle}>Account Settings</h3>
      <MfaSettingsPanel />
      {account?.is_server_admin && <InviteCodeManager />}

      <h3 style={styles.sectionTitle}>Your Sessions</h3>

      <div style={styles.sessionList}>
        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : sessions.length === 0 ? (
          <p style={styles.empty}>No sessions yet. Create or join one to get started!</p>
        ) : (
          sessions.map(session => {
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
              >
                <div style={styles.sessionInfo}>
                  <span style={styles.sessionTitle}>{session.title}</span>
                  <span style={styles.sessionMeta}>
                    {session.user_count ?? 0} participants &middot; {formatDate(session.created_at)}
                  </span>
                </div>
                <div style={styles.sessionRight}>
                  <span style={styles.joinCode}>{session.join_code}</span>
                  <span style={{ ...styles.badge, ...colors }}>
                    {session.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
