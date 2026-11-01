import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useFastingStore } from '@/store/fasting-store';
import { FastingLog, FastingStatus, ChildStats, FetchOptions } from '@/types';
import { useRewardsStore } from '@/store/rewards-store';
import { getCurrentSeason, getRamadanDates, IslamicSeason } from '@/services/islamic-calendar';

// Stats and dates cover one Ramadan, so last year's days never count towards this year's reward.
export const useFasting = (childId: string, season: IslamicSeason = getCurrentSeason()) => {
  const { logs, isLoading, error, setLogs, upsertLog, setLoading, setError } = useFastingStore();
  const { rewards } = useRewardsStore();

  const childLogs = logs[childId] || [];
  const ramadanDates = getRamadanDates(season);

  const fetchFastingLogs = useCallback(async ({ silent = false }: FetchOptions = {}) => {
    if (!childId) return;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('fasting_log')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setLogs(childId, data as FastingLog[]);
    } catch (err) {
      if (!silent) {
        const message = err instanceof Error ? err.message : 'Failed to fetch fasting logs';
        setError(message);
      }
    } finally {
      if (!silent) setLoading(false);
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

  const firstDate = ramadanDates[0];
  const lastDate = ramadanDates[ramadanDates.length - 1];

  const calculateStats = useCallback((): ChildStats => {
    const seasonLogs = childLogs.filter((l) => l.date >= firstDate && l.date <= lastDate);
    const fullDays = seasonLogs.filter((l) => l.status === 'full').length;
    const halfDays = seasonLogs.filter((l) => l.status === 'half').length;
    const noneDays = seasonLogs.filter((l) => l.status === 'none').length;

    const fullAmount = rewards?.full_day_amount ?? 5;
    const halfAmount = rewards?.half_day_amount ?? 2.5;

    const totalReward = (fullDays * fullAmount) + (halfDays * halfAmount);

    return {
      fullDays,
      halfDays,
      noneDays,
      totalReward,
    };
  }, [childLogs, rewards, firstDate, lastDate]);

  return {
    logs: childLogs,
    isLoading,
    error,
    fetchFastingLogs,
    updateFastingStatus,
    getStatusForDate,
    calculateStats,
    ramadanDates,
  };
};
