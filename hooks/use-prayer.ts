import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { usePrayerStore } from '@/store/prayer-store';
import { FetchOptions, PrayerLog, PrayerName } from '@/types';

export const PRAYER_NAMES: { key: PrayerName; label: string; short: string }[] = [
  { key: 'fajr', label: 'Fajr', short: 'F' },
  { key: 'dhuhr', label: 'Dhuhr', short: 'D' },
  { key: 'asr', label: 'Asr', short: 'A' },
  { key: 'maghrib', label: 'Maghrib', short: 'M' },
  { key: 'isha', label: 'Isha', short: 'I' },
];

export const usePrayer = (childId: string) => {
  const { logs, isLoading, error, setLogs, upsertLog, setLoading, setError } = usePrayerStore();

  const childLogs = logs[childId] || [];

  const fetchPrayerLogs = useCallback(async ({ silent = false }: FetchOptions = {}) => {
    if (!childId) return;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('prayer_log')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setLogs(childId, data as PrayerLog[]);
    } catch (err) {
      if (!silent) {
        const message = err instanceof Error ? err.message : 'Failed to fetch prayer logs';
        setError(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [childId, setLogs, setLoading, setError]);

  const updatePrayer = useCallback(async (date: string, prayer: PrayerName, completed: boolean) => {
    if (!childId) return { success: false, error: 'No child selected' };

    const freshLogs = usePrayerStore.getState().logs[childId] || [];
    const existing = freshLogs.find((l) => l.date === date);

    const optimisticLog: PrayerLog = {
      id: existing?.id ?? `temp-${date}`,
      child_id: childId,
      date,
      fajr: existing?.fajr ?? false,
      dhuhr: existing?.dhuhr ?? false,
      asr: existing?.asr ?? false,
      maghrib: existing?.maghrib ?? false,
      isha: existing?.isha ?? false,
      [prayer]: completed,
    };
    upsertLog(childId, optimisticLog);

    try {
      const { data, error: upsertError } = await supabase
        .from('prayer_log')
        .upsert(
          { child_id: childId, date, [prayer]: completed },
          { onConflict: 'child_id,date' },
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      upsertLog(childId, data as PrayerLog);
      return { success: true, log: data as PrayerLog };
    } catch (err) {
      const latestLogs = usePrayerStore.getState().logs[childId] || [];
      const latest = latestLogs.find((l) => l.date === date) ?? optimisticLog;
      upsertLog(childId, { ...latest, [prayer]: existing?.[prayer] ?? false });

      const message = err instanceof Error ? err.message : 'Failed to update prayer';
      setError(message);
      return { success: false, error: message };
    }
  }, [childId, upsertLog, setError]);

  const getPrayerLogForDate = useCallback((date: string): PrayerLog | null => {
    return childLogs.find((l) => l.date === date) ?? null;
  }, [childLogs]);

  const getPrayerCountForDate = useCallback((date: string): number => {
    const log = childLogs.find((l) => l.date === date);
    if (!log) return 0;
    return [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length;
  }, [childLogs]);

  // One calendar year, to match the year-to-date denominator (daysElapsed * 5).
  const getTotalPrayerCount = useCallback((year: number): number => {
    const prefix = `${year}-`;
    return childLogs.reduce((total, log) => {
      if (!log.date.startsWith(prefix)) return total;
      return total + [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length;
    }, 0);
  }, [childLogs]);

  return {
    logs: childLogs,
    isLoading,
    error,
    fetchPrayerLogs,
    updatePrayer,
    getPrayerLogForDate,
    getPrayerCountForDate,
    getTotalPrayerCount,
  };
};
