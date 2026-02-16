import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
}

const stored =
  typeof window !== 'undefined'
    ? (localStorage.getItem('swarm-theme') as ThemeMode | null)
    : null;

export const useThemeStore = create<ThemeState>((set) => ({
  mode: stored === 'light' ? 'light' : 'dark',
  toggle: () =>
    set((state) => {
      const next = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('swarm-theme', next);
      return { mode: next };
    }),
}));
