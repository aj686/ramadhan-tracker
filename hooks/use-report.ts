import { useCallback, useState } from 'react';
import { DOA_ITEMS } from '@/hooks/use-doa';
import { toDateKey } from '@/services/dates';
import { getCurrentSeason, getRamadanDates, getRamadanLabel } from '@/services/islamic-calendar';
import { buildReportHtml } from '@/services/report';
import { outputReport } from '@/services/report-output';
import { supabase } from '@/services/supabase';
import type { DoaLog, FastingLog, PrayerLog, QuranLog, SunatLog } from '@/types';

const fetchRows = async <T,>(table: string, childId: string): Promise<T[]> => {
  const { data, error } = await supabase.from(table).select('*').eq('child_id', childId);
  if (error) throw error;
  return (data ?? []) as T[];
};

export const useReport = (childId: string, childName: string) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportReport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const [fasting, prayer, sunat, quran, doa] = await Promise.all([
        fetchRows<FastingLog>('fasting_log', childId),
        fetchRows<PrayerLog>('prayer_log', childId),
        fetchRows<SunatLog>('sunat_log', childId),
        fetchRows<QuranLog>('quran_log', childId),
        fetchRows<DoaLog>('doa_log', childId),
      ]);

      const today = new Date();
      const year = today.getFullYear();
      const season = getCurrentSeason(today);
      const daysElapsed = Math.floor((today.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;

      await outputReport(
        buildReportHtml({
          childName,
          ramadanLabel: getRamadanLabel(season),
          ramadanDates: getRamadanDates(season),
          year,
          daysElapsed,
          generatedOn: toDateKey(today),
          fasting,
          prayer,
          sunat,
          quran,
          doa,
          doaItemCount: DOA_ITEMS.length,
        }),
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Could not create the report' };
    } finally {
      setIsGenerating(false);
    }
  }, [childId, childName]);

  return { exportReport, isGenerating };
};
