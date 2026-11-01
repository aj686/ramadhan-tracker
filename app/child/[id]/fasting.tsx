import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoBack } from '@/hooks/use-go-back';
import { useRefetchOnForeground } from '@/hooks/use-refetch-on-foreground';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { useFasting } from '@/hooks/use-fasting';
import { useRewards } from '@/hooks/use-rewards';
import { parseDateKey } from '@/services/dates';
import { getCurrentSeason, getSeasonYear, getSelectableSeasons } from '@/services/islamic-calendar';
import { alertNotSaved } from '@/services/save-error';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { FastingStatus } from '@/types';

const STATUS_OPTIONS: { value: FastingStatus; label: string; icon: string }[] = [
  { value: 'full', label: 'Full', icon: 'sunny' },
  { value: 'half', label: 'Half', icon: 'partly-sunny' },
  { value: 'none', label: 'None', icon: 'close-circle' },
];

export default function FastingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack(`/child/${id}`);
  const { children } = useChildren();
  const seasons = useMemo(() => getSelectableSeasons(), []);
  const [hijriYear, setHijriYear] = useState(() => getCurrentSeason().hijriYear);
  const seasonIndex = Math.max(0, seasons.findIndex((s) => s.hijriYear === hijriYear));
  const season = seasons[seasonIndex];
  const { logs, isLoading, fetchFastingLogs, updateFastingStatus, getStatusForDate, calculateStats, ramadanDates } = useFasting(id, season);
  const { rewards, fetchRewards } = useRewards();

  const child = children.find((c) => c.id === id);

  useEffect(() => {
    fetchFastingLogs();
    fetchRewards();
  }, [fetchFastingLogs, fetchRewards]);

  useRefetchOnForeground(() => {
    fetchFastingLogs({ silent: true });
  });

  const handleStatusChange = useCallback(async (date: string, status: FastingStatus) => {
    const current = getStatusForDate(date);
    if (current === status) return;
    const result = await updateFastingStatus(date, status);
    if (!result.success) alertNotSaved();
  }, [getStatusForDate, updateFastingStatus]);

  const stats = calculateStats();
  const rewardType = rewards?.reward_type ?? 'money';

  const getStatusColor = (status: FastingStatus | null) => {
    if (!status) return colors.borderLight;
    if (status === 'full') return colors.fastingFull;
    if (status === 'half') return colors.fastingHalf;
    return colors.fastingNone;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.fastingColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Puasa Ramadhan</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {child?.name} — {getSeasonYear(season)}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Season switcher: past Ramadans stay viewable and editable */}
      {seasons.length > 1 && (
        <View style={styles.seasonRow}>
          <TouchableOpacity
            onPress={() => setHijriYear(seasons[seasonIndex - 1].hijriYear)}
            disabled={seasonIndex === 0}
            style={[styles.seasonBtn, seasonIndex === 0 && styles.seasonBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Previous Ramadan"
          >
            <Ionicons name="chevron-back" size={18} color={colors.fastingColor} />
          </TouchableOpacity>
          <Text style={[styles.seasonLabel, { color: colors.text }]}>
            {getSeasonYear(season)} · {season.hijriYear}H
          </Text>
          <TouchableOpacity
            onPress={() => setHijriYear(seasons[seasonIndex + 1].hijriYear)}
            disabled={seasonIndex === seasons.length - 1}
            style={[styles.seasonBtn, seasonIndex === seasons.length - 1 && styles.seasonBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Next Ramadan"
          >
            <Ionicons name="chevron-forward" size={18} color={colors.fastingColor} />
          </TouchableOpacity>
        </View>
      )}

      {!season.confirmed && (
        <Text style={[styles.seasonNote, { color: colors.textMuted }]}>
          Expected dates. Follow JAKIM&apos;s announcement if the first day differs.
        </Text>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { num: stats.fullDays, label: 'Full Days', color: colors.fastingFull },
            { num: stats.halfDays, label: 'Half Days', color: colors.fastingHalf },
            {
              num: rewardType === 'money' ? `RM${stats.totalReward.toFixed(2)}` : '🎁',
              label: 'Earned',
              color: colors.rewardColor,
            },
          ].map((s, i) => (
            <View
              key={i}
              style={[styles.statCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}
            >
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
                <View style={[styles.statContent, { backgroundColor: colors.glass }]}>
                  <Text style={[styles.statNum, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit>
                    {s.num}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                </View>
              </BlurView>
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {STATUS_OPTIONS.map((opt) => (
            <View key={opt.value} style={styles.legendItem}>
              <Ionicons name={opt.icon as any} size={13} color={getStatusColor(opt.value)} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {opt.label}
                {rewardType === 'money'
                  ? opt.value === 'full' ? ` (RM${rewards?.full_day_amount ?? 5})`
                  : opt.value === 'half' ? ` (RM${rewards?.half_day_amount ?? 2.5})` : ''
                  : opt.value === 'full' && rewards?.custom_reward_full ? ` (${rewards.custom_reward_full})`
                  : opt.value === 'half' && rewards?.custom_reward_half ? ` (${rewards.custom_reward_half})` : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Day log */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Log</Text>

        {isLoading && logs.length === 0 ? (
          <ActivityIndicator size="large" color={colors.fastingColor} style={{ marginTop: spacing.xxxl }} />
        ) : (
          ramadanDates.map((date) => {
            const status = getStatusForDate(date);
            const dayObj = parseDateKey(date);
            const dayNum = dayObj.getDate();
            const month = dayObj.toLocaleDateString('en-US', { month: 'short' });

            return (
              <View key={date} style={[styles.dayRow, { borderBottomColor: colors.borderLight }]}>
                {/* Date */}
                <View style={styles.dayLabel}>
                  <Text style={[styles.dayNum, { color: colors.text }]}>{dayNum}</Text>
                  <Text style={[styles.dayMonth, { color: colors.textMuted }]}>{month}</Text>
                </View>

                <View style={[styles.dayDivider, { backgroundColor: colors.borderLight }]} />

                {/* Status buttons */}
                <View style={styles.statusButtons}>
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = status === opt.value;
                    const btnColor = getStatusColor(opt.value);
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.statusBtn,
                          isSelected
                            ? { backgroundColor: btnColor }
                            : { backgroundColor: colors.primaryMuted },
                        ]}
                        onPress={() => handleStatusChange(date, opt.value)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={13}
                          color={isSelected ? '#FFFFFF' : colors.textMuted}
                        />
                        <Text style={[
                          styles.statusBtnText,
                          { color: isSelected ? '#FFFFFF' : colors.textMuted },
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  seasonBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  seasonBtnDisabled: { opacity: 0.3 },
  seasonLabel: { ...typography.subhead, fontWeight: '600' },
  seasonNote: { ...typography.caption, textAlign: 'center', paddingHorizontal: spacing.xl },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  blur: { overflow: 'hidden' },
  statContent: { alignItems: 'center', paddingVertical: spacing.lg },
  statNum: { ...typography.title3 },
  statLabel: { ...typography.caption, marginTop: 2 },
  legend: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendText: { ...typography.caption },
  sectionTitle: { ...typography.headline, marginBottom: spacing.md },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  dayLabel: { width: 36, alignItems: 'center' },
  dayNum: { ...typography.headline },
  dayMonth: { ...typography.caption },
  dayDivider: { width: 1, height: 36 },
  statusButtons: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  statusBtnText: { ...typography.caption, fontWeight: '600' },
});
