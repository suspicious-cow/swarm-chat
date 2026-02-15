import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface MfaSetup {
  secret: string;
  uri: string;
}

interface AuthState {
  account: Account | null;
  loading: boolean;
  error: string | null;
  mfaRequired: boolean;

  register: (username: string, password: string, display_name: string, invite_code?: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  setupMfa: () => Promise<MfaSetup>;
  enableMfa: (secret: string, code: string) => Promise<void>;
  disableMfa: (code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(persist((set) => ({
  account: null,
  loading: false,
  error: null,
  mfaRequired: false,

  register: async (username, password, display_name, invite_code?) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password, display_name, invite_code: invite_code || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
      }
      const account: Account = await res.json();
      set({ account, loading: false, error: null });
    } catch (e: unknown) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }
      const data = await res.json();
      if (data.mfa_required) {
        set({ mfaRequired: true, loading: false, error: null });
      } else {
        const account: Account = data;
        set({ account, mfaRequired: false, loading: false, error: null });
      }
    } catch (e: unknown) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (_) {
      // best-effort
    }
    set({ account: null, mfaRequired: false, loading: false, error: null });
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });
      if (!res.ok) {
        set({ account: null, loading: false });
        return;
      }
      const account: Account = await res.json();
      set({ account, loading: false });
    } catch (_) {
      set({ account: null, loading: false });
    }
  },

  verifyMfa: async (code: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/auth/mfa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'MFA verification failed');
      }
      const account: Account = await res.json();
      set({ account, mfaRequired: false, loading: false, error: null });
    } catch (e: unknown) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  setupMfa: async (): Promise<MfaSetup> => {
    const res = await fetch(`${API_BASE}/api/auth/mfa/setup`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'MFA setup failed');
    }
    return res.json();
  },

  enableMfa: async (secret: string, code: string) => {
    const res = await fetch(`${API_BASE}/api/auth/mfa/enable-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ secret, code }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to enable MFA');
    }
  },

  disableMfa: async (code: string) => {
    const res = await fetch(`${API_BASE}/api/auth/mfa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to disable MFA');
    }
  },
}), {
  name: 'swarm-chat-auth',
  partialize: (state) => ({
    account: state.account,
  }),
}));
