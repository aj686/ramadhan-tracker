import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { useFasting } from '@/hooks/use-fasting';
import { useRewards } from '@/hooks/use-rewards';
import { usePrayer } from '@/hooks/use-prayer';
import { useStreak } from '@/hooks/use-streak';
import { TrackerCard } from '@/components/tracker-card';
import { borderRadius, spacing, typography } from '@/constants/theme';

const RAMADAN_TOTAL_DAYS = 30;
const CURRENT_YEAR = new Date().getFullYear();

export default function ChildDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { children } = useChildren();
  const { fetchFastingLogs, calculateStats, isLoading: fastingLoading } = useFasting(id);
  const { rewards, fetchRewards } = useRewards();
  const { fetchPrayerLogs, getTotalPrayerCount, isLoading: prayerLoading } = usePrayer(id);

  const child = children.find((c) => c.id === id);
  const isLoading = fastingLoading || prayerLoading;

  useEffect(() => {
    fetchFastingLogs();
    fetchRewards();
    fetchPrayerLogs();
  }, [fetchFastingLogs, fetchRewards, fetchPrayerLogs]);

  const stats = calculateStats();
  const totalPrayers = getTotalPrayerCount();
  const rewardType = rewards?.reward_type ?? 'money';
  const { currentStreak } = useStreak(id);

  const today = new Date();
  const yearStart = new Date(CURRENT_YEAR, 0, 1);
  const daysElapsed = Math.max(1, Math.floor((today.getTime() - yearStart.getTime()) / 86400000) + 1);
  const possiblePrayersSoFar = daysElapsed * 5;

  const rewardValueLabel = useCallback(() => {
    if (rewardType === 'custom') {
      const fullReward = rewards?.custom_reward_full;
      const halfReward = rewards?.custom_reward_half;
      if (stats.fullDays > 0 && fullReward) return fullReward;
      if (stats.halfDays > 0 && halfReward) return halfReward;
      return 'Custom';
    }
    return `RM ${stats.totalReward.toFixed(2)}`;
  }, [rewardType, rewards, stats]);

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
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
        ) : (
          <>
            {/* Reward summary card */}
            <View style={[styles.rewardCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
                <View style={[styles.rewardContent, { backgroundColor: colors.glass }]}>
                  <View style={[styles.rewardIcon, { backgroundColor: colors.rewardMuted }]}>
                    <Ionicons name="gift" size={24} color={colors.rewardColor} />
                  </View>
                  <View style={styles.rewardText}>
                    <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>
                      Total Reward Earned
                    </Text>
                    <Text style={[styles.rewardValue, { color: colors.rewardColor }]}>
                      {rewardValueLabel()}
                    </Text>
                  </View>
                  <View style={styles.miniStats}>
                    <View style={styles.miniStat}>
                      <Text style={[styles.miniStatNum, { color: colors.fastingColor }]}>
                        {stats.fullDays}
                      </Text>
                      <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>Full</Text>
                    </View>
                    <View style={styles.miniStat}>
                      <Text style={[styles.miniStatNum, { color: colors.rewardColor }]}>
                        {stats.halfDays}
                      </Text>
                      <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>Half</Text>
                    </View>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Section label */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trackers</Text>

            {/* Puasa Ramadhan */}
            <TrackerCard
              label="Puasa Ramadhan"
              icon="sunny"
              color={colors.fastingColor}
              muted={colors.fastingMuted}
              current={stats.fullDays + stats.halfDays}
              total={RAMADAN_TOTAL_DAYS}
              locked={false}
              onPress={() => router.push(`/child/${id}/fasting`)}
            />

            {/* Solat */}
            <TrackerCard
              label="Solat 5 Waktu"
              icon="moon"
              color={colors.prayerColor}
              muted={colors.prayerMuted}
              current={totalPrayers}
              total={possiblePrayersSoFar}
              locked={false}
              onPress={() => router.push(`/child/${id}/prayer`)}
            />

            {/* Streak chip */}
            {currentStreak > 0 && (
              <View style={[styles.streakChip, { backgroundColor: colors.rewardMuted }]}>
                <Text style={styles.streakFire}>🔥</Text>
                <Text style={[styles.streakText, { color: colors.rewardColor }]}>
                  {currentStreak} day prayer streak!
                </Text>
              </View>
            )}

            {/* Phase 2 — Premium trackers */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.sm }]}>
              Premium Trackers
            </Text>

            <TrackerCard
              label="Puasa Sunat"
              icon="water"
              color={colors.sunatColor}
              muted={colors.sunatMuted}
              current={0}
              total={1}
              locked
              onPress={() => router.push(`/child/${id}/sunat`)}
            />

            <TrackerCard
              label="Quran Reading"
              icon="book"
              color={colors.quranColor}
              muted={colors.quranMuted}
              current={0}
              total={1}
              locked
              onPress={() => router.push(`/child/${id}/quran`)}
            />

            <TrackerCard
              label="Doa Harian"
              icon="heart"
              color={colors.doaColor}
              muted={colors.doaMuted}
              current={0}
              total={1}
              locked
              onPress={() => router.push(`/child/${id}/doa`)}
            />
          </>
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
  rewardCard: {
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
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardText: { flex: 1 },
  rewardLabel: { ...typography.caption },
  rewardValue: { ...typography.title3, marginTop: 2 },
  miniStats: { flexDirection: 'row', gap: spacing.lg },
  miniStat: { alignItems: 'center' },
  miniStatNum: { ...typography.headline },
  miniStatLabel: { ...typography.caption },
  sectionTitle: { ...typography.headline, marginBottom: spacing.md },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  streakFire: { fontSize: 16 },
  streakText: { ...typography.subhead, fontWeight: '600' },
});
