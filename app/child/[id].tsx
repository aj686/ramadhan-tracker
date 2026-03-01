import React, { useEffect, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { useFasting } from '@/hooks/use-fasting';
import { useRewards } from '@/hooks/use-rewards';
import { usePrayer, PRAYER_NAMES } from '@/hooks/use-prayer';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { FastingStatus, PrayerName } from '@/types';

const RAMADAN_TOTAL_DAYS = 30;
const TOTAL_PRAYERS = RAMADAN_TOTAL_DAYS * 5; // 150

const STATUS_OPTIONS: { value: FastingStatus; label: string; icon: string }[] = [
  { value: 'full', label: 'Full', icon: 'sunny' },
  { value: 'half', label: 'Half', icon: 'partly-sunny' },
  { value: 'none', label: 'None', icon: 'close-circle' },
];

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { children } = useChildren();
  const { logs, isLoading, fetchFastingLogs, updateFastingStatus, getStatusForDate, calculateStats, ramadanDates } = useFasting(id);
  const { rewards, fetchRewards } = useRewards();
  const { fetchPrayerLogs, updatePrayer, getPrayerLogForDate, getTotalPrayerCount } = usePrayer(id);

  const child = children.find((c) => c.id === id);

  useEffect(() => {
    fetchFastingLogs();
    fetchRewards();
    fetchPrayerLogs();
  }, [fetchFastingLogs, fetchRewards, fetchPrayerLogs]);

  const handleStatusChange = useCallback(async (date: string, status: FastingStatus) => {
    const current = getStatusForDate(date);
    if (current === status) return;
    await updateFastingStatus(date, status);
  }, [getStatusForDate, updateFastingStatus]);

  const handlePrayerToggle = useCallback(async (date: string, prayer: PrayerName, currentValue: boolean) => {
    await updatePrayer(date, prayer, !currentValue);
  }, [updatePrayer]);

  const stats = calculateStats();
  const totalPrayers = getTotalPrayerCount();
  const rewardType = rewards?.reward_type ?? 'money';

  const getStatusColor = (status: FastingStatus | null) => {
    if (!status) return colors.borderLight;
    if (status === 'full') return colors.fastingFull;
    if (status === 'half') return colors.fastingHalf;
    return colors.fastingNone;
  };

  const getDayNumber = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.getDate();
  };

  const getMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const renderEarnedValue = () => {
    if (rewardType === 'custom') {
      const fullReward = rewards?.custom_reward_full;
      const halfReward = rewards?.custom_reward_half;
      if (stats.fullDays > 0 && fullReward) return fullReward;
      if (stats.halfDays > 0 && halfReward) return halfReward;
      return 'Custom';
    }
    return `RM${stats.totalReward.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0A1F13', '#0F2D1B', '#0A1F13']
          : ['#ECFDF5', '#D1FAE5', '#A7F3D0']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {child?.name || 'Child'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Ramadan 2026
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fasting Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.fastingFull }]}>
            <Text style={[styles.statNumber, { color: colors.fastingFull }]}>{stats.fullDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Full Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.fastingHalf }]}>
            <Text style={[styles.statNumber, { color: colors.fastingHalf }]}>{stats.halfDays}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Half Days</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
              {renderEarnedValue()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned</Text>
          </View>
        </View>

        {/* Prayer Summary */}
        <View style={[styles.prayerSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.prayerSummaryIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="moon" size={20} color={colors.primary} />
          </View>
          <View style={styles.prayerSummaryText}>
            <Text style={[styles.prayerSummaryTitle, { color: colors.text }]}>
              Prayers Completed
            </Text>
            <Text style={[styles.prayerSummaryCount, { color: colors.textSecondary }]}>
              {totalPrayers} / {TOTAL_PRAYERS}
            </Text>
          </View>
          <View style={styles.prayerProgressWrap}>
            <View style={[styles.prayerProgressBg, { backgroundColor: colors.primaryMuted }]}>
              <View
                style={[
                  styles.prayerProgressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round((totalPrayers / TOTAL_PRAYERS) * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.prayerProgressPct, { color: colors.textMuted }]}>
              {Math.round((totalPrayers / TOTAL_PRAYERS) * 100)}%
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {STATUS_OPTIONS.map((opt) => (
            <View key={opt.value} style={styles.legendItem}>
              <Ionicons
                name={opt.icon as any}
                size={14}
                color={getStatusColor(opt.value)}
              />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {opt.label}
                {rewardType === 'money'
                  ? opt.value === 'full'
                    ? ` (RM${rewards?.full_day_amount ?? 5})`
                    : opt.value === 'half'
                    ? ` (RM${rewards?.half_day_amount ?? 2.5})`
                    : ''
                  : opt.value === 'full' && rewards?.custom_reward_full
                  ? ` (${rewards.custom_reward_full})`
                  : opt.value === 'half' && rewards?.custom_reward_half
                  ? ` (${rewards.custom_reward_half})`
                  : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Fasting + Prayer Log */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fasting & Prayer Log</Text>

        {isLoading && logs.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : (
          ramadanDates.map((date) => {
            const status = getStatusForDate(date);
            const dayNum = getDayNumber(date);
            const month = getMonthLabel(date);
            const prayerLog = getPrayerLogForDate(date);

            return (
              <View
                key={date}
                style={[styles.dayRow, { borderColor: colors.borderLight }]}
              >
                {/* Day label */}
                <View style={styles.dayLabel}>
                  <Text style={[styles.dayNumber, { color: colors.text }]}>{dayNum}</Text>
                  <Text style={[styles.dayMonth, { color: colors.textMuted }]}>{month}</Text>
                </View>

                <View style={[styles.dayDivider, { backgroundColor: colors.borderLight }]} />

                {/* Right section: fasting + prayer rows */}
                <View style={styles.dayRight}>
                  {/* Fasting status buttons */}
                  <View style={styles.statusButtons}>
                    {STATUS_OPTIONS.map((opt) => {
                      const isSelected = status === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.statusBtn,
                            isSelected
                              ? { backgroundColor: getStatusColor(opt.value) }
                              : { backgroundColor: colors.primaryMuted },
                          ]}
                          onPress={() => handleStatusChange(date, opt.value)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={opt.icon as any}
                            size={14}
                            color={isSelected ? '#FFFFFF' : colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.statusBtnText,
                              { color: isSelected ? '#FFFFFF' : colors.textMuted },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Prayer toggle buttons */}
                  <View style={styles.prayerButtons}>
                    {PRAYER_NAMES.map((p) => {
                      const done = prayerLog ? prayerLog[p.key] : false;
                      return (
                        <TouchableOpacity
                          key={p.key}
                          style={[
                            styles.prayerBtn,
                            done
                              ? { backgroundColor: colors.primary }
                              : { backgroundColor: colors.primaryMuted },
                          ]}
                          onPress={() => handlePrayerToggle(date, p.key, done)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                        >
                          <Text style={[styles.prayerBtnText, { color: done ? '#FFFFFF' : colors.textMuted }]}>
                            {p.short}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.title3,
  },
  headerSub: {
    ...typography.caption,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  statNumber: {
    ...typography.title3,
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  prayerSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  prayerSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerSummaryText: {
    flex: 1,
  },
  prayerSummaryTitle: {
    ...typography.footnote,
    fontWeight: '600',
  },
  prayerSummaryCount: {
    ...typography.caption,
    marginTop: 1,
  },
  prayerProgressWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  prayerProgressBg: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  prayerProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  prayerProgressPct: {
    ...typography.caption,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendText: {
    ...typography.caption,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  dayLabel: {
    width: 36,
    alignItems: 'center',
  },
  dayNumber: {
    ...typography.headline,
  },
  dayMonth: {
    ...typography.caption,
  },
  dayDivider: {
    width: 1,
    height: 48,
  },
  dayRight: {
    flex: 1,
    gap: spacing.xs,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  statusBtnText: {
    ...typography.caption,
    fontWeight: '600',
  },
  prayerButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  prayerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  prayerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
