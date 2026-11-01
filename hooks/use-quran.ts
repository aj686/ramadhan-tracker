import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useQuranStore } from '@/store/quran-store';
import { FetchOptions, QuranLog } from '@/types';

export const QURAN_TOTAL_PAGES = 604; // 30 juz

export const useQuran = (childId: string) => {
  const { logs, isLoading, error, setLogs, upsertLog, setLoading, setError } =
    useQuranStore();

  const childLogs = logs[childId] || [];

  const fetchQuranLogs = useCallback(async ({ silent = false }: FetchOptions = {}) => {
    if (!childId) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const { data, error: err } = await supabase
        .from('quran_log')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: true });
      if (err) throw err;
      setLogs(childId, data as QuranLog[]);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : 'Failed to fetch quran logs');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [childId, setLogs, setLoading, setError]);

  const updatePages = useCallback(
    async (date: string, pages: number) => {
      if (!childId) return { success: false, error: 'No child selected' };
      const safePages = Math.max(0, pages);
      const freshLogs = useQuranStore.getState().logs[childId] || [];
      const existing = freshLogs.find((l) => l.date === date);

      // Optimistic
      const optimistic: QuranLog = {
        id: existing?.id ?? `temp-${date}`,
        child_id: childId,
        date,
        pages_read: safePages,
      };
      upsertLog(childId, optimistic);

      try {
        const { data, error: err } = await supabase
          .from('quran_log')
          .upsert(
            { child_id: childId, date, pages_read: safePages },
            { onConflict: 'child_id,date' },
          )
          .select()
          .single();
        if (err) throw err;
        upsertLog(childId, data as QuranLog);
        return { success: true };
      } catch (e) {
        upsertLog(childId, existing ?? { ...optimistic, pages_read: 0 });
        const message = e instanceof Error ? e.message : 'Failed to update';
        setError(message);
        return { success: false, error: message };
      }
    },
    [childId, upsertLog, setError],
  );

  const getPagesForDate = useCallback(
    (date: string) => childLogs.find((l) => l.date === date)?.pages_read ?? 0,
    [childLogs],
  );

  const calculateStats = useCallback((year: number) => {
    const prefix = `${year}-`;
    const yearLogs = childLogs.filter((l) => l.date.startsWith(prefix));
    const totalPages = yearLogs.reduce((s, l) => s + l.pages_read, 0);
    const daysWithReading = yearLogs.filter((l) => l.pages_read > 0).length;
    const avgPerDay =
      daysWithReading > 0 ? Math.round(totalPages / daysWithReading) : 0;
    const pct = Math.min(
      100,
      Math.round((totalPages / QURAN_TOTAL_PAGES) * 100),
    );
    return { totalPages, daysWithReading, avgPerDay, pct };
  }, [childLogs]);

  const getMonthPages = useCallback(
    (monthKey: string) =>
      childLogs
        .filter((l) => l.date.startsWith(monthKey))
        .reduce((s, l) => s + l.pages_read, 0),
    [childLogs],
  );

  return {
    logs: childLogs,
    isLoading,
    error,
    fetchQuranLogs,
    updatePages,
    getPagesForDate,
    calculateStats,
    getMonthPages,
  };
};
