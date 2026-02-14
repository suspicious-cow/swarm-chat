import { useState } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '40px',
    paddingTop: '60px',
  },
  hero: {
    textAlign: 'center' as const,
    maxWidth: '600px',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#e0e0ff',
    marginBottom: '12px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#8888bb',
    lineHeight: 1.6,
  },
  cards: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  card: {
    background: '#1a1a3e',
    border: '1px solid #2a2a5a',
    borderRadius: '12px',
    padding: '32px',
    width: '340px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#c0c0ff',
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    background: '#0f0f23',
    border: '1px solid #3a3a6a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box' as const,
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#6a6a9a',
    marginBottom: '4px',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#4a4aff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#ff6b6b',
    fontSize: '13px',
    marginTop: '8px',
  },
};

export function LobbyView() {
  const { createSession, joinSession, currentSession, error, setView } = useDeliberationStore();
  const [createTitle, setCreateTitle] = useState('');
  const [createSize, setCreateSize] = useState(5);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [creatorName, setCreatorName] = useState('');

  const handleCreate = async () => {
    if (!createTitle.trim() || !creatorName.trim()) return;
    await createSession(createTitle.trim(), createSize);
  };

  const handleJoinCreated = async () => {
    const state = useDeliberationStore.getState();
    if (state.currentSession && creatorName.trim()) {
      await joinSession(state.currentSession.join_code, creatorName.trim());
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !joinName.trim()) return;
    await joinSession(joinCode.trim(), joinName.trim());
  };

  // After creating a session, prompt to join it
  if (currentSession && !useDeliberationStore.getState().currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.hero}>
          <h2 style={styles.heroTitle}>Session Created!</h2>
          <p style={styles.heroSubtitle}>
            Share this code with participants:
          </p>
          <div style={{
            fontSize: '48px',
            fontWeight: 800,
            color: '#7c8aff',
            letterSpacing: '8px',
            margin: '24px 0',
          }}>
            {currentSession.join_code}
          </div>
          <p style={styles.heroSubtitle}>{currentSession.title}</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Join as Admin</h3>
          <label style={styles.label}>Your display name</label>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={creatorName}
            onChange={e => setCreatorName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoinCreated()}
          />
          <button style={styles.btn} onClick={handleJoinCreated}>
            Enter Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>Conversational Swarm Intelligence</h2>
        <p style={styles.heroSubtitle}>
          Enable productive real-time group deliberation at scale.
          Participants are split into small overlapping subgroups connected
          by AI Surrogate Agents that relay insights between groups.
        </p>
      </div>

      <div style={styles.cards}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Create a Session</h3>
          <label style={styles.label}>Deliberation topic / question</label>
          <input
            style={styles.input}
            placeholder="e.g. Should cities ban cars from downtown?"
            value={createTitle}
            onChange={e => setCreateTitle(e.target.value)}
          />
          <label style={styles.label}>Your display name</label>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={creatorName}
            onChange={e => setCreatorName(e.target.value)}
          />
          <label style={styles.label}>Subgroup size (3-10)</label>
          <input
            style={styles.input}
            type="number"
            min={3}
            max={10}
            value={createSize}
            onChange={e => setCreateSize(Number(e.target.value))}
          />
          <button style={styles.btn} onClick={handleCreate}>
            Create Session
          </button>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Join a Session</h3>
          <label style={styles.label}>Join code</label>
          <input
            style={styles.input}
            placeholder="e.g. A3X9K2"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <label style={styles.label}>Your display name</label>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={joinName}
            onChange={e => setJoinName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button style={styles.btn} onClick={handleJoin}>
            Join Session
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}
