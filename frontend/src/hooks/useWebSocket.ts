import { useEffect, useRef, useCallback } from 'react';
import type { Message, Subgroup } from '../types';
import { useDeliberationStore } from '../stores/deliberationStore';

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const sessionWsRef = useRef<WebSocket | null>(null);
  const {
    currentUser,
    currentSession,
    addMessage,
    setSurrogateTyping,
    setSubgroups,
    setView,
    fetchMessages,
    fetchSubgroups,
  } = useDeliberationStore();

  // Chat WebSocket (per subgroup)
  useEffect(() => {
    if (!currentUser?.subgroup_id || !currentUser?.id) return;

    const ws = new WebSocket(
      `${WS_BASE}/ws/chat/${currentUser.id}/${currentUser.subgroup_id}`
    );

    ws.onopen = () => {
      console.log('Chat WS connected');
    };

    ws.onmessage = (event) => {
      const { event: evt, data } = JSON.parse(event.data);

      if (evt === 'chat:new_message') {
        // Don't add duplicate messages from our own sends
        const msg = data as Message;
        addMessage(msg);
      } else if (evt === 'chat:surrogate_typing') {
        setSurrogateTyping(true);
        setTimeout(() => setSurrogateTyping(false), 5000);
      }
    };

    ws.onclose = () => console.log('Chat WS disconnected');
    ws.onerror = (e) => console.error('Chat WS error:', e);

    wsRef.current = ws;

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [currentUser?.id, currentUser?.subgroup_id]);

  // Session WebSocket (for admin/visualizer events)
  useEffect(() => {
    if (!currentUser?.id || !currentSession?.id) return;

    const ws = new WebSocket(
      `${WS_BASE}/ws/session/${currentUser.id}/${currentSession.id}`
    );

    ws.onopen = () => console.log('Session WS connected');

    ws.onmessage = (event) => {
      const { event: evt, data } = JSON.parse(event.data);

      if (evt === 'session:started') {
        // Update user's subgroup assignment
        const subgroupData = data.subgroup as Subgroup | undefined;
        if (subgroupData && data.user_id === currentUser?.id) {
          const store = useDeliberationStore.getState();
          store.setCurrentSubgroup(subgroupData);
          // Refresh user to get subgroup assignment
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/users/${currentUser.id}`)
            .then(r => r.json())
            .then(user => {
              useDeliberationStore.setState({ currentUser: user });
              setView('chat');
              fetchMessages();
              fetchSubgroups();
            });
        } else if (data.subgroups) {
          setSubgroups(data.subgroups);
          fetchSubgroups();
        }
      } else if (evt === 'session:completed') {
        const store = useDeliberationStore.getState();
        const sessionId = store.currentSession?.id;
        useDeliberationStore.setState(s => ({
          currentSession: s.currentSession
            ? { ...s.currentSession, status: 'completed' as const }
            : null
        }));
        // Auto-navigate to results view
        if (sessionId) {
          store.fetchResults(sessionId).then(() => {
            setView('results');
          });
        }
      } else if (evt === 'session:convergence') {
        const convergence = data.convergence as number;
        useDeliberationStore.setState(s => ({
          currentSession: s.currentSession
            ? { ...s.currentSession, convergence }
            : null
        }));
      }
    };

    ws.onclose = () => console.log('Session WS disconnected');
    sessionWsRef.current = ws;

    return () => {
      ws.close();
      sessionWsRef.current = null;
    };
  }, [currentUser?.id, currentSession?.id]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'chat:message',
        data: { content, subgroup_id: currentUser?.subgroup_id },
      }));
    }
  }, [currentUser?.subgroup_id]);

  return { sendMessage };
}
