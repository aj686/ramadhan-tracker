import { create } from 'zustand';
import { SunatLog } from '@/types';

interface SunatState {
  logs: Record<string, SunatLog[]>; // keyed by child_id
  isLoading: boolean;
  error: string | null;
  setLogs: (childId: string, logs: SunatLog[]) => void;
  upsertLog: (childId: string, log: SunatLog) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLogs: () => void;
}

export const useSunatStore = create<SunatState>((set) => ({
  logs: {},
  isLoading: false,
  error: null,
  setLogs: (childId, logs) =>
    set((state) => ({ logs: { ...state.logs, [childId]: logs } })),
  upsertLog: (childId, log) =>
    set((state) => {
      const existing = state.logs[childId] || [];
      const idx = existing.findIndex(
        (l) => l.date === log.date && l.type === log.type,
      );
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
