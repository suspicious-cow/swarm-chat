import { useDeliberation } from './hooks/useDeliberation';
import { Layout } from './components/Layout';
import { LobbyView } from './components/LobbyView';
import { WaitingView } from './components/WaitingView';
import { ChatRoom } from './components/ChatRoom';
import { Visualizer } from './components/Visualizer';

export default function App() {
  const { view } = useDeliberation();

  return (
    <Layout>
      {view === 'lobby' && <LobbyView />}
      {view === 'waiting' && <WaitingView />}
      {view === 'chat' && <ChatRoom />}
      {view === 'visualizer' && <Visualizer />}
    </Layout>
  );
}
