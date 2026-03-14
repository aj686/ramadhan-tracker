import { useMemo } from 'react';
import { usePrayerStore } from '@/store/prayer-store';

/**
 * Calculates prayer streak for a child.
 * A "streak day" = all 5 prayers completed.
 */
export const useStreak = (childId: string) => {
  const { logs } = usePrayerStore();
  const childLogs = logs[childId] || [];

  const { currentStreak, longestStreak } = useMemo(() => {
    if (childLogs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Build a set of "perfect prayer days" (5/5)
    const perfectDays = new Set<string>();
    childLogs.forEach((log) => {
      const count = [
        log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha,
      ].filter(Boolean).length;
      if (count === 5) perfectDays.add(log.date);
    });

    if (perfectDays.size === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort dates ascending
    const sorted = Array.from(perfectDays).sort();

    // Longest streak
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        run++;
        longest = Math.max(longest, run);
      } else {
        run = 1;
      }
    }

    // Current streak (backward from today)
    const todayStr = (() => {
      const t = new Date();
      const mm = String(t.getMonth() + 1).padStart(2, '0');
      const dd = String(t.getDate()).padStart(2, '0');
      return `${t.getFullYear()}-${mm}-${dd}`;
    })();

    let current = 0;
    let checkDate = new Date(todayStr);
    while (true) {
      const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
      const dd = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${checkDate.getFullYear()}-${mm}-${dd}`;
      if (perfectDays.has(dateStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { currentStreak: current, longestStreak: longest };
  }, [childLogs]);

  return { currentStreak, longestStreak };
};
