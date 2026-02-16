import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './toastStore';
import type { Session, SessionResults, User, Subgroup, Message, Idea } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

type View = 'home' | 'new-session' | 'join-session' | 'settings'
  | 'waiting' | 'chat' | 'visualizer' | 'participants' | 'results';

interface DeliberationState {
  // Current user & session
  currentUser: User | null;
  currentSession: Session | null;
  currentSubgroup: Subgroup | null;

  // Session data
  subgroups: Subgroup[];
  messages: Message[];
  ideas: Idea[];

  // UI state
  view: View;
  surrogateTyping: boolean;
  error: string | null;
  resultsData: SessionResults | null;

  // Actions
  createSession: (title: string, subgroupSize: number) => Promise<void>;
  joinSession: (joinCode: string, displayName: string) => Promise<void>;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  fetchSession: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchSubgroups: () => Promise<void>;
  fetchIdeas: () => Promise<void>;
  fetchResults: (sessionId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setSurrogateTyping: (typing: boolean) => void;
  setSubgroups: (subgroups: Subgroup[]) => void;
  setCurrentSubgroup: (subgroup: Subgroup) => void;
  setView: (view: View) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDeliberationStore = create<DeliberationState>()(persist((set, get) => ({
  currentUser: null,
  currentSession: null,
  currentSubgroup: null,
  subgroups: [],
  messages: [],
  ideas: [],
  view: 'home',
  surrogateTyping: false,
  error: null,
  resultsData: null,

  createSession: async (title, subgroupSize) => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, subgroup_size: subgroupSize }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const session: Session = await res.json();
      set({ currentSession: session, error: null });
      useToastStore.getState().addToast('Session created!', 'success');
    } catch (e: unknown) {
      set({ error: (e as Error).message });
      useToastStore.getState().addToast('Failed to create session', 'error');
    }
  },

  joinSession: async (joinCode, displayName) => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ join_code: joinCode, display_name: displayName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to join');
      }
      const user: User = await res.json();

      // Fetch session details
      const sessionRes = await fetch(`${API_BASE}/api/sessions/${user.session_id}`, {
        credentials: 'include',
      });
      const session: Session = await sessionRes.json();

      set({
        currentUser: user,
        currentSession: session,
        view: session.status === 'active' ? 'chat' : 'waiting',
        error: null,
      });

      useToastStore.getState().addToast(`Joined "${session.title}"`, 'success');

      // If already active and assigned to a subgroup, load messages
      if (user.subgroup_id) {
        const userRes = await fetch(`${API_BASE}/api/users/${user.id}`, {
          credentials: 'include',
        });
        const updatedUser: User = await userRes.json();
        set({ currentUser: updatedUser });
        await get().fetchMessages();
        await get().fetchSubgroups();
      }
    } catch (e: unknown) {
      set({ error: (e as Error).message });
      useToastStore.getState().addToast((e as Error).message, 'error');
    }
  },

  startSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${currentSession.id}/start`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to start');
      }
      const subgroups: Subgroup[] = await res.json();
      set({
        subgroups,
        currentSession: { ...currentSession, status: 'active' },
        error: null,
      });
      useToastStore.getState().addToast('Deliberation started!', 'success');
    } catch (e: unknown) {
      set({ error: (e as Error).message });
      useToastStore.getState().addToast('Failed to start deliberation', 'error');
    }
  },

  stopSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      await fetch(`${API_BASE}/api/sessions/${currentSession.id}/stop`, {
        method: 'POST',
        credentials: 'include',
      });
      set({ currentSession: { ...currentSession, status: 'completed' } });
      useToastStore.getState().addToast('Deliberation ended', 'info');
    } catch (e: unknown) {
      set({ error: (e as Error).message });
      useToastStore.getState().addToast('Failed to stop deliberation', 'error');
    }
  },

  fetchSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${currentSession.id}`, {
        credentials: 'include',
      });
      const session: Session = await res.json();
      set({ currentSession: session });
    } catch {
      // silent
    }
  },

  fetchMessages: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${currentUser.id}/messages`, {
        credentials: 'include',
      });
      if (res.ok) {
        const messages: Message[] = await res.json();
        set({ messages });
      }
    } catch {
      // silent
    }
  },

  fetchSubgroups: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${currentSession.id}/subgroups`, {
        credentials: 'include',
      });
      if (res.ok) {
        const subgroups: Subgroup[] = await res.json();
        set({ subgroups });
      }
    } catch {
      // silent
    }
  },

  fetchIdeas: async () => {
    const { currentSession } = get();
    if (!currentSession) return;
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${currentSession.id}/ideas`, {
        credentials: 'include',
      });
      if (res.ok) {
        const ideas: Idea[] = await res.json();
        set({ ideas });
      }
    } catch {
      // silent
    }
  },

  fetchResults: async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/results`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: SessionResults = await res.json();
        set({ resultsData: data });
      }
    } catch {
      // silent
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      surrogateTyping: false,
    }));
  },

  setSurrogateTyping: (typing) => set({ surrogateTyping: typing }),
  setSubgroups: (subgroups) => set({ subgroups }),
  setCurrentSubgroup: (subgroup) => set({ currentSubgroup: subgroup }),
  setView: (view) => set({ view }),
  setError: (error) => set({ error }),
  reset: () => set({
    currentUser: null,
    currentSession: null,
    currentSubgroup: null,
    subgroups: [],
    messages: [],
    ideas: [],
    view: 'home',
    surrogateTyping: false,
    error: null,
    resultsData: null,
  }),
}), {
  name: 'swarm-chat-session',
  version: 2,
  partialize: (state) => ({
    currentUser: state.currentUser,
    currentSession: state.currentSession,
    view: state.view,
  }),
  migrate: (persisted: unknown, version: number) => {
    const state = persisted as Record<string, unknown>;
    if (version < 2) {
      // Map old view names to new ones
      const viewMap: Record<string, string> = {
        dashboard: 'home',
        lobby: 'home',
      };
      const oldView = state.view as string;
      state.view = viewMap[oldView] || oldView;
    }
    return state as unknown as DeliberationState;
  },
}));
