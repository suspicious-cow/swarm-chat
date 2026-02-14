import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeliberationStore } from '../../stores/deliberationStore';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function resetStore() {
  useDeliberationStore.getState().reset();
}

beforeEach(() => {
  resetStore();
  mockFetch.mockReset();
});

describe('deliberationStore', () => {
  describe('initial state', () => {
    it('has lobby view by default', () => {
      expect(useDeliberationStore.getState().view).toBe('lobby');
    });

    it('has null user and session', () => {
      const state = useDeliberationStore.getState();
      expect(state.currentUser).toBeNull();
      expect(state.currentSession).toBeNull();
      expect(state.currentSubgroup).toBeNull();
    });

    it('has empty arrays', () => {
      const state = useDeliberationStore.getState();
      expect(state.subgroups).toEqual([]);
      expect(state.messages).toEqual([]);
      expect(state.ideas).toEqual([]);
    });

    it('has no error', () => {
      expect(useDeliberationStore.getState().error).toBeNull();
    });
  });

  describe('createSession', () => {
    it('sets currentSession on success', async () => {
      const session = {
        id: '123', title: 'Test', status: 'waiting',
        join_code: 'ABC123', subgroup_size: 5, created_at: '2025-01-01',
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => session,
      });

      await useDeliberationStore.getState().createSession('Test', 5);

      expect(useDeliberationStore.getState().currentSession).toEqual(session);
      expect(useDeliberationStore.getState().error).toBeNull();
    });

    it('sets error on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });

      await useDeliberationStore.getState().createSession('Test', 5);

      expect(useDeliberationStore.getState().error).toBe('Failed to create session');
      expect(useDeliberationStore.getState().currentSession).toBeNull();
    });
  });

  describe('joinSession', () => {
    it('sets currentUser and currentSession, transitions to waiting', async () => {
      const user = {
        id: 'u1', display_name: 'Alice', session_id: 's1',
        subgroup_id: null, is_admin: true, created_at: '2025-01-01',
      };
      const session = {
        id: 's1', title: 'Test', status: 'waiting',
        join_code: 'ABC123', subgroup_size: 5, created_at: '2025-01-01',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => user })
        .mockResolvedValueOnce({ ok: true, json: async () => session });

      await useDeliberationStore.getState().joinSession('ABC123', 'Alice');

      const state = useDeliberationStore.getState();
      expect(state.currentUser).toEqual(user);
      expect(state.currentSession).toEqual(session);
      expect(state.view).toBe('waiting');
      expect(state.error).toBeNull();
    });

    it('transitions to chat when session is active', async () => {
      const user = {
        id: 'u1', display_name: 'Alice', session_id: 's1',
        subgroup_id: null, is_admin: false, created_at: '2025-01-01',
      };
      const session = {
        id: 's1', title: 'Test', status: 'active',
        join_code: 'ABC123', subgroup_size: 5, created_at: '2025-01-01',
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => user })
        .mockResolvedValueOnce({ ok: true, json: async () => session });

      await useDeliberationStore.getState().joinSession('ABC123', 'Alice');

      expect(useDeliberationStore.getState().view).toBe('chat');
    });

    it('sets error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid join code' }),
      });

      await useDeliberationStore.getState().joinSession('BAD', 'Alice');

      expect(useDeliberationStore.getState().error).toBe('Invalid join code');
    });
  });

  describe('addMessage', () => {
    it('appends to messages array', () => {
      const msg = {
        id: 'm1', subgroup_id: 'sg1', user_id: 'u1', display_name: 'Alice',
        content: 'Hello', msg_type: 'human' as const, source_subgroup_id: null,
        created_at: '2025-01-01',
      };

      useDeliberationStore.getState().addMessage(msg);

      expect(useDeliberationStore.getState().messages).toHaveLength(1);
      expect(useDeliberationStore.getState().messages[0]).toEqual(msg);
    });

    it('clears surrogateTyping', () => {
      useDeliberationStore.setState({ surrogateTyping: true });
      const msg = {
        id: 'm1', subgroup_id: 'sg1', user_id: null, display_name: 'Surrogate Agent',
        content: 'Relay', msg_type: 'surrogate' as const, source_subgroup_id: null,
        created_at: '2025-01-01',
      };

      useDeliberationStore.getState().addMessage(msg);

      expect(useDeliberationStore.getState().surrogateTyping).toBe(false);
    });
  });

  describe('reset', () => {
    it('returns to initial state', () => {
      useDeliberationStore.setState({
        view: 'chat',
        error: 'some error',
        messages: [{ id: 'm1' }] as any,
      });

      useDeliberationStore.getState().reset();

      const state = useDeliberationStore.getState();
      expect(state.view).toBe('lobby');
      expect(state.error).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.currentUser).toBeNull();
    });
  });

  describe('setView', () => {
    it('changes view', () => {
      useDeliberationStore.getState().setView('visualizer');
      expect(useDeliberationStore.getState().view).toBe('visualizer');
    });
  });
});
