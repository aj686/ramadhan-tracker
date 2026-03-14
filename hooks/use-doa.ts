import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useDoaStore } from '@/store/doa-store';
import { DoaLog, DoaKey } from '@/types';

export const DOA_ITEMS: { key: DoaKey; label: string; short: string }[] = [
  { key: 'doa_makan',        label: 'Makan',        short: 'Mkn'  },
  { key: 'doa_tidur',        label: 'Tidur',        short: 'Tdr'  },
  { key: 'doa_masuk_rumah',  label: 'Masuk Rumah',  short: 'Msuk' },
  { key: 'doa_keluar_rumah', label: 'Keluar Rumah', short: 'Klur' },
  { key: 'doa_tandas',       label: 'Tandas',       short: 'Tnd'  },
  { key: 'doa_kenderaan',    label: 'Kenderaan',    short: 'Kend' },
];

const EMPTY_DOA: Omit<DoaLog, 'id' | 'child_id' | 'date'> = {
  doa_makan: false,
  doa_tidur: false,
  doa_masuk_rumah: false,
  doa_keluar_rumah: false,
  doa_tandas: false,
  doa_kenderaan: false,
};

export const useDoa = (childId: string) => {
  const { logs, isLoading, error, setLogs, upsertLog, setLoading, setError } =
    useDoaStore();

  const childLogs = logs[childId] || [];

  const fetchDoaLogs = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('doa_log')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: true });
      if (err) throw err;
      setLogs(childId, data as DoaLog[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch doa logs');
    } finally {
      setLoading(false);
    }
  }, [childId, setLogs, setLoading, setError]);

  const updateDoa = useCallback(
    async (date: string, key: DoaKey, value: boolean) => {
      if (!childId) return;
      const existing = childLogs.find((l) => l.date === date);
      const updated: DoaLog = {
        id: existing?.id ?? `temp-${date}`,
        child_id: childId,
        date,
        ...EMPTY_DOA,
        ...existing,
        [key]: value,
      };
      upsertLog(childId, updated);

      try {
        const { data, error: err } = await supabase
          .from('doa_log')
          .upsert(
            {
              child_id: childId,
              date,
              ...EMPTY_DOA,
              ...existing,
              [key]: value,
            },
            { onConflict: 'child_id,date' },
          )
          .select()
          .single();
        if (err) throw err;
        upsertLog(childId, data as DoaLog);
      } catch (e) {
        if (existing) upsertLog(childId, existing);
        setError(e instanceof Error ? e.message : 'Failed to update');
      }
    },
    [childId, childLogs, upsertLog, setError],
  );

  const getDoaForDate = useCallback(
    (date: string): DoaLog | null =>
      childLogs.find((l) => l.date === date) ?? null,
    [childLogs],
  );

  const getDoaCountForDate = useCallback(
    (date: string): number => {
      const log = childLogs.find((l) => l.date === date);
      if (!log) return 0;
      return DOA_ITEMS.filter((d) => log[d.key]).length;
    },
    [childLogs],
  );

  const calculateStats = useCallback(() => {
    const total = childLogs.reduce(
      (s, l) => s + DOA_ITEMS.filter((d) => l[d.key]).length,
      0,
    );
    return { total, daysLogged: childLogs.length };
  }, [childLogs]);

  return {
    logs: childLogs,
    isLoading,
    error,
    fetchDoaLogs,
    updateDoa,
    getDoaForDate,
    getDoaCountForDate,
    calculateStats,
  };
};
