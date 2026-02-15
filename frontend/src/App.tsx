import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useDeliberation } from './hooks/useDeliberation';
import { Layout } from './components/Layout';
import { LoginView } from './components/LoginView';
import { MfaChallengeView } from './components/MfaChallengeView';
import { DashboardView } from './components/DashboardView';
import { LobbyView } from './components/LobbyView';
import { WaitingView } from './components/WaitingView';
import { ChatRoom } from './components/ChatRoom';
import { Visualizer } from './components/Visualizer';

export default function App() {
  const { account, loading, mfaRequired, fetchMe } = useAuthStore();
  const { view } = useDeliberation();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', paddingTop: '80px', color: '#6a6a9a' }}>
          Loading...
        </div>
      </Layout>
    );
  }

  if (!account && mfaRequired) {
    return (
      <Layout>
        <MfaChallengeView />
      </Layout>
    );
  }

  if (!account) {
    return (
      <Layout>
        <LoginView />
      </Layout>
    );
  }

  return (
    <Layout>
      {view === 'dashboard' && <DashboardView />}
      {view === 'lobby' && <LobbyView />}
      {view === 'waiting' && <WaitingView />}
      {view === 'chat' && <ChatRoom />}
      {view === 'visualizer' && <Visualizer />}
    </Layout>
  );
}
