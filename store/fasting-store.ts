import { create } from 'zustand';
import { FastingLog } from '@/types';

interface FastingState {
  logs: Record<string, FastingLog[]>; // keyed by child_id
  isLoading: boolean;
  error: string | null;
  setLogs: (childId: string, logs: FastingLog[]) => void;
  upsertLog: (childId: string, log: FastingLog) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLogs: () => void;
}

export const useFastingStore = create<FastingState>((set) => ({
  logs: {},
  isLoading: false,
  error: null,
  setLogs: (childId, logs) =>
    set((state) => ({
      logs: { ...state.logs, [childId]: logs },
    })),
  upsertLog: (childId, log) =>
    set((state) => {
      const existingLogs = state.logs[childId] || [];
      const index = existingLogs.findIndex((l) => l.date === log.date);
      let newLogs: FastingLog[];
      if (index >= 0) {
        newLogs = [...existingLogs];
        newLogs[index] = log;
      } else {
        newLogs = [...existingLogs, log];
      }
      return { logs: { ...state.logs, [childId]: newLogs } };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearLogs: () => set({ logs: {}, error: null }),
}));
