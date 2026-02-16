import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useDeliberation } from './hooks/useDeliberation';
import { Layout } from './components/Layout';
import { LoginView } from './components/LoginView';
import { MfaChallengeView } from './components/MfaChallengeView';
import { HomeView } from './components/HomeView';
import { NewSessionView } from './components/NewSessionView';
import { JoinSessionView } from './components/JoinSessionView';
import { SettingsView } from './components/SettingsView';
import { WaitingView } from './components/WaitingView';
import { ChatRoom } from './components/ChatRoom';
import { Visualizer } from './components/Visualizer';
import { ParticipantsView } from './components/ParticipantsView';
import { ResultsView } from './components/ResultsView';

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
      {view === 'home' && <HomeView />}
      {view === 'new-session' && <NewSessionView />}
      {view === 'join-session' && <JoinSessionView />}
      {view === 'settings' && <SettingsView />}
      {view === 'waiting' && <WaitingView />}
      {view === 'chat' && <ChatRoom />}
      {view === 'visualizer' && <Visualizer />}
      {view === 'participants' && <ParticipantsView />}
      {view === 'results' && <ResultsView />}
    </Layout>
  );
}
