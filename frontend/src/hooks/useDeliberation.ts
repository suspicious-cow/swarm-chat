import { useEffect } from 'react';
import { useDeliberationStore } from '../stores/deliberationStore';

export function useDeliberation() {
  const {
    currentSession,
    currentUser,
    view,
    fetchSession,
    fetchSubgroups,
    fetchIdeas,
  } = useDeliberationStore();

  // Poll session status while waiting
  useEffect(() => {
    if (view !== 'waiting' || !currentSession) return;

    const interval = setInterval(() => {
      fetchSession();
    }, 3000);

    return () => clearInterval(interval);
  }, [view, currentSession?.id]);

  // When session becomes active, switch to chat
  useEffect(() => {
    if (currentSession?.status === 'active' && view === 'waiting') {
      // Refresh user to get subgroup assignment
      if (currentUser) {
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/users/${currentUser.id}`)
          .then(r => r.json())
          .then(user => {
            useDeliberationStore.setState({
              currentUser: user,
              view: user.subgroup_id ? 'chat' : 'waiting',
            });
            if (user.subgroup_id) {
              fetchSubgroups();
            }
          });
      }
    }
  }, [currentSession?.status]);

  // Poll ideas while in visualizer or chat
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'active') return;
    if (view !== 'chat' && view !== 'visualizer') return;

    const interval = setInterval(() => {
      fetchIdeas();
      fetchSubgroups();
    }, 10000);

    return () => clearInterval(interval);
  }, [view, currentSession?.id, currentSession?.status]);

  return { currentSession, currentUser, view };
}
