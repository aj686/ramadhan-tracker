import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { usePrayer, PRAYER_NAMES } from '@/hooks/use-prayer';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { PrayerName } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayItem {
  date: string;
  dayNum: number;
  dayName: string;
  isToday: boolean;
  isFuture: boolean;
}

function buildMonthDays(year: number, month: number): DayItem[] {
  const todayMs = new Date(new Date().toDateString()).getTime();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const d = new Date(year, month, day);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return {
      date: `${year}-${mm}-${dd}`,
      dayNum: day,
      dayName: DAY_SHORT[d.getDay()],
      isToday: d.getTime() === todayMs,
      isFuture: d.getTime() > todayMs,
    };
  });
}

const CURRENT_YEAR = new Date().getFullYear();
const TODAY = new Date();

// ─── Component ───────────────────────────────────────────────────────────────

export default function PrayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { children } = useChildren();
  const {
    fetchPrayerLogs,
    updatePrayer,
    getPrayerLogForDate,
    getPrayerCountForDate,
    getTotalPrayerCount,
    logs,
    isLoading,
  } = usePrayer(id);

  const child = children.find((c) => c.id === id);
  const [selectedMonth, setSelectedMonth] = useState(TODAY.getMonth());

  useEffect(() => {
    fetchPrayerLogs();
  }, [fetchPrayerLogs]);

  // Per-month stats map: month index → { done, possible, pct }
  const monthStats = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((log) => {
      const key = log.date.slice(0, 7); // 'YYYY-MM'
      const count = [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length;
      map[key] = (map[key] || 0) + count;
    });

    return Array.from({ length: 12 }, (_, month) => {
      const mm = String(month + 1).padStart(2, '0');
      const key = `${CURRENT_YEAR}-${mm}`;
      const daysInMonth = new Date(CURRENT_YEAR, month + 1, 0).getDate();

      // For past/current months count elapsed days; future months = 0 possible
      const monthEnd = new Date(CURRENT_YEAR, month + 1, 0);
      const isPastMonth = monthEnd < TODAY && month !== TODAY.getMonth();
      const isCurrentMonth = month === TODAY.getMonth() && CURRENT_YEAR === TODAY.getFullYear();
      const isFutureMonth = monthEnd > TODAY && !isCurrentMonth;

      let possible = 0;
      if (isPastMonth) possible = daysInMonth * 5;
      else if (isCurrentMonth) possible = TODAY.getDate() * 5;
      // future: possible stays 0

      const done = map[key] ?? 0;
      const pct = possible > 0 ? Math.min(100, Math.round((done / possible) * 100)) : 0;
      return { done, possible, pct, isFutureMonth, daysInMonth };
    });
  }, [logs]);

  // Year-to-date summary
  const yearTotal = getTotalPrayerCount();
  const yearStart = new Date(CURRENT_YEAR, 0, 1);
  const daysElapsed = Math.max(1, Math.floor((TODAY.getTime() - yearStart.getTime()) / 86400000) + 1);
  const possibleSoFar = daysElapsed * 5;
  const yearPct = Math.min(100, Math.round((yearTotal / possibleSoFar) * 100));

  // Days for selected month
  const selectedDays = useMemo(
    () => buildMonthDays(CURRENT_YEAR, selectedMonth),
    [selectedMonth],
  );

  const handlePrayerToggle = useCallback(async (
    date: string, prayer: PrayerName, currentValue: boolean,
  ) => {
    await updatePrayer(date, prayer, !currentValue);
  }, [updatePrayer]);

  const selectedStats = monthStats[selectedMonth];
  const selectedDaysDone = selectedDays.filter(
    (d) => getPrayerCountForDate(d.date) > 0,
  ).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#FFFFFF', '#FFFFFF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.prayerColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Solat 5 Waktu</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {child?.name ?? ''} — {CURRENT_YEAR}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && logs.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.prayerColor} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Year summary card ── */}
          <View style={[styles.summaryCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
              <View style={[styles.summaryContent, { backgroundColor: colors.glass }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.prayerMuted }]}>
                  <Ionicons name="moon" size={22} color={colors.prayerColor} />
                </View>
                <View style={styles.summaryText}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>
                    {CURRENT_YEAR} Progress
                  </Text>
                  <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
                    {yearTotal} / {possibleSoFar} prayers
                  </Text>
                  <View style={[styles.progressTrack, { backgroundColor: colors.prayerMuted }]}>
                    <View style={[
                      styles.progressFill,
                      { backgroundColor: colors.prayerColor, width: `${yearPct}%` as any },
                    ]} />
                  </View>
                </View>
                <Text style={[styles.pctBadge, { color: colors.prayerColor }]}>
                  {yearPct}%
                </Text>
              </View>
            </BlurView>
          </View>

          {/* ── Month grid ── */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Month</Text>

          <View style={styles.monthGrid}>
            {Array.from({ length: 12 }, (_, month) => {
              const stat = monthStats[month];
              const isSelected = month === selectedMonth;
              const isCurrentMonth = month === TODAY.getMonth();
              const textColor = stat.isFutureMonth
                ? colors.textMuted
                : isSelected ? colors.prayerColor : colors.text;

              return (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthCell,
                    {
                      backgroundColor: isSelected
                        ? `${colors.prayerColor}12`
                        : colors.backgroundSecondary,
                      borderColor: isSelected ? colors.prayerColor : 'transparent',
                    },
                  ]}
                  onPress={() => setSelectedMonth(month)}
                  activeOpacity={0.7}
                >
                  {/* Current month dot */}
                  {isCurrentMonth && (
                    <View style={[styles.currentDot, { backgroundColor: colors.prayerColor }]} />
                  )}

                  <Text style={[styles.monthCellName, { color: textColor }]}>
                    {MONTH_SHORT[month]}
                  </Text>

                  {stat.isFutureMonth ? (
                    <Text style={[styles.monthCellCount, { color: colors.textMuted }]}>—</Text>
                  ) : (
                    <Text style={[styles.monthCellCount, { color: colors.textSecondary }]}>
                      {stat.done}/{stat.possible}
                    </Text>
                  )}

                  {/* Mini progress bar */}
                  <View style={[styles.miniTrack, { backgroundColor: colors.prayerMuted }]}>
                    {!stat.isFutureMonth && stat.possible > 0 && (
                      <View style={[
                        styles.miniFill,
                        {
                          backgroundColor: isSelected ? colors.prayerColor : colors.prayerColor,
                          width: `${stat.pct}%` as any,
                          opacity: isSelected ? 1 : 0.6,
                        },
                      ]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Selected month detail ── */}
          <View style={[styles.monthDetailHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.monthDetailLeft}>
              <Text style={[styles.monthDetailTitle, { color: colors.text }]}>
                {MONTH_NAMES[selectedMonth]}
              </Text>
              <Text style={[styles.monthDetailSub, { color: colors.textSecondary }]}>
                {selectedDaysDone} day{selectedDaysDone !== 1 ? 's' : ''} tracked
                {selectedStats.possible > 0 ? `  ·  ${selectedStats.pct}%` : ''}
              </Text>
            </View>
            {selectedStats.possible > 0 && (
              <View style={[styles.pctChip, { backgroundColor: colors.prayerMuted }]}>
                <Text style={[styles.pctChipText, { color: colors.prayerColor }]}>
                  {selectedStats.done}/{selectedStats.possible}
                </Text>
              </View>
            )}
          </View>

          {/* Column labels */}
          <View style={[styles.colHeader, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.colDate} />
            <View style={[styles.colDivider, { backgroundColor: 'transparent' }]} />
            <View style={styles.colPrayers}>
              {PRAYER_NAMES.map((p) => (
                <Text key={p.key} style={[styles.colLabel, { color: colors.textMuted }]}>
                  {p.label.slice(0, 3)}
                </Text>
              ))}
            </View>
            <View style={styles.colCount} />
          </View>

          {/* Day rows */}
          {selectedDays.map((item) => {
            const prayerLog = getPrayerLogForDate(item.date);
            const doneCount = getPrayerCountForDate(item.date);
            const isFriday = item.dayName === 'Fri';

            return (
              <View
                key={item.date}
                style={[
                  styles.dayRow,
                  { borderBottomColor: colors.borderLight },
                  item.isToday && { backgroundColor: `${colors.prayerColor}08` },
                ]}
              >
                {item.isToday && (
                  <View style={[styles.todayBar, { backgroundColor: colors.prayerColor }]} />
                )}

                {/* Date */}
                <View style={styles.colDate}>
                  <Text style={[
                    styles.dayNum,
                    { color: item.isToday ? colors.prayerColor : item.isFuture ? colors.textMuted : colors.text },
                  ]}>
                    {item.dayNum}
                  </Text>
                  <Text style={[
                    styles.dayName,
                    {
                      color: isFriday && !item.isFuture
                        ? colors.fastingColor
                        : item.isToday ? colors.prayerColor : colors.textMuted,
                      fontWeight: isFriday ? '700' : '400',
                    },
                  ]}>
                    {item.dayName}
                  </Text>
                </View>

                <View style={[styles.colDivider, { backgroundColor: colors.borderLight }]} />

                {/* Prayer buttons */}
                <View style={styles.colPrayers}>
                  {PRAYER_NAMES.map((p) => {
                    const done = prayerLog ? prayerLog[p.key] : false;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.prayerBtn,
                          { backgroundColor: done ? colors.prayerColor : colors.prayerMuted },
                        ]}
                        onPress={() => handlePrayerToggle(item.date, p.key, done)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                      >
                        <Text style={[
                          styles.prayerBtnText,
                          { color: done ? '#FFFFFF' : colors.prayerColor },
                        ]}>
                          {p.label.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Count badge */}
                <View style={styles.colCount}>
                  <Text style={[
                    styles.countText,
                    {
                      color: doneCount === 5
                        ? colors.prayerColor
                        : doneCount > 0 ? colors.rewardColor : colors.borderLight,
                    },
                  ]}>
                    {doneCount}/5
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const COL_DATE_W = 42;
const COL_DIVIDER_W = 1;
const COL_COUNT_W = 34;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...typography.title3 },
  headerSub: { ...typography.caption, marginTop: 2 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  // Year summary
  summaryCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  blur: { overflow: 'hidden' },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: { flex: 1 },
  summaryTitle: { ...typography.headline },
  summaryCount: { ...typography.caption, marginTop: 2, marginBottom: spacing.xs },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  pctBadge: { ...typography.headline, fontWeight: '700' },

  // Section label
  sectionLabel: { ...typography.headline, marginBottom: spacing.md },

  // Month grid — 4 columns
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  monthCell: {
    width: '23%',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 2,
    position: 'relative',
  },
  currentDot: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  monthCellName: { ...typography.footnote, fontWeight: '700' },
  monthCellCount: { fontSize: 10, lineHeight: 13 },
  miniTrack: {
    width: '85%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  miniFill: { height: '100%', borderRadius: 2 },

  // Month detail header
  monthDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  monthDetailLeft: { gap: 2 },
  monthDetailTitle: { ...typography.title3 },
  monthDetailSub: { ...typography.caption },
  pctChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  pctChipText: { ...typography.footnote, fontWeight: '700' },

  // Column header
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  colDate: { width: COL_DATE_W, alignItems: 'center' },
  colDivider: { width: COL_DIVIDER_W, height: 16 },
  colPrayers: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  colCount: { width: COL_COUNT_W, alignItems: 'flex-end' },
  colLabel: { flex: 1, ...typography.caption, fontWeight: '700', textAlign: 'center' },

  // Day row
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    gap: spacing.md,
    paddingLeft: spacing.xs,
  },
  todayBar: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: 2,
  },
  dayNum: { ...typography.subhead, fontWeight: '600', textAlign: 'center' },
  dayName: { ...typography.caption, textAlign: 'center' },
  prayerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    minWidth: 0,
  },
  prayerBtnText: { fontSize: 10, fontWeight: '700', lineHeight: 13 },
  countText: { ...typography.caption, fontWeight: '700', textAlign: 'right' },
});
