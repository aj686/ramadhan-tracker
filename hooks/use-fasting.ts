import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useFastingStore } from '@/store/fasting-store';
import { FastingLog, FastingStatus, ChildStats } from '@/types';
import { useRewardsStore } from '@/store/rewards-store';

// Ramadan 2025 dates (March 1 - March 30, 2025)
// Adjust these dates based on the actual Ramadan dates for your region
export const RAMADAN_START = '2025-03-01';
export const RAMADAN_DAYS = 30;

export const getRamadanDates = (): string[] => {
  const dates: string[] = [];
  const startDate = new Date(RAMADAN_START);

  for (let i = 0; i < RAMADAN_DAYS; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

export const useFasting = (childId: string) => {
  const { logs, isLoading, error, setLogs, upsertLog, setLoading, setError } = useFastingStore();
  const { rewards } = useRewardsStore();

  const childLogs = logs[childId] || [];

  const fetchFastingLogs = useCallback(async () => {
    if (!childId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('fasting_log')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setLogs(childId, data as FastingLog[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch fasting logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [childId, setLogs, setLoading, setError]);

  const updateFastingStatus = useCallback(async (date: string, status: FastingStatus) => {
    if (!childId) return { success: false, error: 'No child selected' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: upsertError } = await supabase
        .from('fasting_log')
        .upsert(
          {
            child_id: childId,
            date,
            status,
          },
          {
            onConflict: 'child_id,date',
          }
        )
        .select()
        .single();

      if (upsertError) throw upsertError;

      upsertLog(childId, data as FastingLog);
      return { success: true, log: data as FastingLog };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update fasting status';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [childId, upsertLog, setLoading, setError]);

  const getStatusForDate = useCallback((date: string): FastingStatus | null => {
    const log = childLogs.find((l) => l.date === date);
    return log ? log.status : null;
  }, [childLogs]);

  const calculateStats = useCallback((): ChildStats => {
    const fullDays = childLogs.filter((l) => l.status === 'full').length;
    const halfDays = childLogs.filter((l) => l.status === 'half').length;
    const noneDays = childLogs.filter((l) => l.status === 'none').length;

    const fullAmount = rewards?.full_day_amount ?? 5;
    const halfAmount = rewards?.half_day_amount ?? 2.5;

    const totalReward = (fullDays * fullAmount) + (halfDays * halfAmount);

    return {
      fullDays,
      halfDays,
      noneDays,
      totalReward,
    };
  }, [childLogs, rewards]);

  return {
    logs: childLogs,
    isLoading,
    error,
    fetchFastingLogs,
    updateFastingStatus,
    getStatusForDate,
    calculateStats,
    ramadanDates: getRamadanDates(),
  };
};
