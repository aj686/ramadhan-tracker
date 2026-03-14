import { create } from 'zustand';
import { QuranLog } from '@/types';

interface QuranState {
  logs: Record<string, QuranLog[]>; // keyed by child_id
  isLoading: boolean;
  error: string | null;
  setLogs: (childId: string, logs: QuranLog[]) => void;
  upsertLog: (childId: string, log: QuranLog) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLogs: () => void;
}

export const useQuranStore = create<QuranState>((set) => ({
  logs: {},
  isLoading: false,
  error: null,
  setLogs: (childId, logs) =>
    set((state) => ({ logs: { ...state.logs, [childId]: logs } })),
  upsertLog: (childId, log) =>
    set((state) => {
      const existing = state.logs[childId] || [];
      const idx = existing.findIndex((l) => l.date === log.date);
      const updated =
        idx >= 0
          ? existing.map((l, i) => (i === idx ? log : l))
          : [...existing, log];
      return { logs: { ...state.logs, [childId]: updated } };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearLogs: () => set({ logs: {}, error: null }),
}));
