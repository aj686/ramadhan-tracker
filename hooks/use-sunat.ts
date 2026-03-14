import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useSunatStore } from '@/store/sunat-store';
import { SunatLog, SunatType } from '@/types';

// ── Generate sunat dates for 2026 ────────────────────────────────────────────

export function getSunatDates(year: number): Record<SunatType, string[]> {
  const isnin_khamis: string[] = [];
  const syawal: string[] = [];
  const arafah: string[] = [];

  // All Mondays (1) and Thursdays (4) of the year
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dow = new Date(year, month, day).getDay();
      if (dow === 1 || dow === 4) {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        isnin_khamis.push(`${year}-${mm}-${dd}`);
      }
    }
  }

  // Syawal 2026: Eid ~April 1 → fast any 6 of April 2–30
  if (year === 2026) {
    for (let d = 2; d <= 30; d++) {
      syawal.push(`${year}-04-${String(d).padStart(2, '0')}`);
    }
    // Arafah 2026: 9 Dhul Hijjah ≈ June 10
    arafah.push(`${year}-06-10`);
  }

  return { isnin_khamis, syawal, arafah };
}

export const SUNAT_TYPE_LABELS: Record<SunatType, string> = {
  isnin_khamis: 'Isnin & Khamis',
  syawal: '6 Syawal',
  arafah: 'Hari Arafah',
};

export const SUNAT_TYPE_TARGET: Record<SunatType, number> = {
  isnin_khamis: 0, // varies — computed from actual list
  syawal: 6,
  arafah: 1,
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useSunat = (childId: string) => {
  const { logs, isLoading, error, setLogs, upsertLog, setLoading, setError } =
    useSunatStore();

  const childLogs = logs[childId] || [];

  const fetchSunatLogs = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('sunat_log')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: true });
      if (err) throw err;
      setLogs(childId, data as SunatLog[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sunat logs');
    } finally {
      setLoading(false);
    }
  }, [childId, setLogs, setLoading, setError]);

  const toggleSunat = useCallback(
    async (date: string, type: SunatType) => {
      if (!childId) return;
      const existing = childLogs.find(
        (l) => l.date === date && l.type === type,
      );
      const newCompleted = !existing?.completed;

      // Optimistic
      const optimistic: SunatLog = {
        id: existing?.id ?? `temp-${date}-${type}`,
        child_id: childId,
        date,
        type,
        completed: newCompleted,
      };
      upsertLog(childId, optimistic);

      try {
        const { data, error: err } = await supabase
          .from('sunat_log')
          .upsert(
            { child_id: childId, date, type, completed: newCompleted },
            { onConflict: 'child_id,date,type' },
          )
          .select()
          .single();
        if (err) throw err;
        upsertLog(childId, data as SunatLog);
      } catch (e) {
        // revert
        if (existing) upsertLog(childId, existing);
        else {
          upsertLog(childId, { ...optimistic, completed: false });
        }
        setError(e instanceof Error ? e.message : 'Failed to update');
      }
    },
    [childId, childLogs, upsertLog, setError],
  );

  const isCompleted = useCallback(
    (date: string, type: SunatType) =>
      childLogs.find((l) => l.date === date && l.type === type)?.completed ??
      false,
    [childLogs],
  );

  const calculateStats = useCallback(() => {
    const byType: Record<SunatType, number> = {
      isnin_khamis: 0,
      syawal: 0,
      arafah: 0,
    };
    childLogs.forEach((l) => {
      if (l.completed) byType[l.type] = (byType[l.type] || 0) + 1;
    });
    return {
      byType,
      total: Object.values(byType).reduce((a, b) => a + b, 0),
    };
  }, [childLogs]);

  return {
    logs: childLogs,
    isLoading,
    error,
    fetchSunatLogs,
    toggleSunat,
    isCompleted,
    calculateStats,
  };
};
