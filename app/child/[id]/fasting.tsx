import React, { useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { useFasting } from '@/hooks/use-fasting';
import { useRewards } from '@/hooks/use-rewards';
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
  const router = useRouter();
  const { children } = useChildren();
  const { logs, isLoading, fetchFastingLogs, updateFastingStatus, getStatusForDate, calculateStats, ramadanDates } = useFasting(id);
  const { rewards, fetchRewards } = useRewards();

  const child = children.find((c) => c.id === id);

  useEffect(() => {
    fetchFastingLogs();
    fetchRewards();
  }, [fetchFastingLogs, fetchRewards]);

  const handleStatusChange = useCallback(async (date: string, status: FastingStatus) => {
    const current = getStatusForDate(date);
    if (current === status) return;
    await updateFastingStatus(date, status);
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.fastingColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Puasa Ramadhan</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {child?.name} — 2026
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
            const dayObj = new Date(date);
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
