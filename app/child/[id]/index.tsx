import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { usePrayer } from '@/hooks/use-prayer';
import { useStreak } from '@/hooks/use-streak';
import { useSubscription } from '@/hooks/use-subscription';
import { getSunatDates, useSunat } from '@/hooks/use-sunat';
import { QURAN_TOTAL_PAGES, useQuran } from '@/hooks/use-quran';
import { DOA_ITEMS, useDoa } from '@/hooks/use-doa';
import { useReport } from '@/hooks/use-report';
import { Alert } from '@/services/alert';
import { TrackerCard } from '@/components/tracker-card';
import { getCurrentSeason, getRamadanLabel, RAMADAN_DAYS } from '@/services/islamic-calendar';
import { borderRadius, spacing, typography } from '@/constants/theme';

const SYAWAL_TARGET = 6;

export default function ChildDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack('/(tabs)');
  const { children } = useChildren();
  const { fetchFastingLogs, calculateStats, isLoading: fastingLoading } = useFasting(id);
  const { rewards, fetchRewards } = useRewards();
  const { fetchPrayerLogs, getTotalPrayerCount, isLoading: prayerLoading } = usePrayer(id);
  const { canAccessSunat, canAccessQuran, canAccessDoa, canAccessStreak, canExportReport } = useSubscription();
  const { fetchSunatLogs, calculateStats: calculateSunatStats } = useSunat(id);
  const { fetchQuranLogs, calculateStats: calculateQuranStats } = useQuran(id);
  const { fetchDoaLogs, calculateStats: calculateDoaStats } = useDoa(id);

  const child = children.find((c) => c.id === id);
  const isLoading = fastingLoading || prayerLoading;
  const { exportReport, isGenerating } = useReport(id, child?.name ?? '');

  const handleExportReport = async () => {
    const result = await exportReport();
    if (!result.success) Alert.alert('Could not create the report', result.error ?? 'Please try again.');
  };

  useEffect(() => {
    fetchFastingLogs();
    fetchRewards();
    fetchPrayerLogs();
  }, [fetchFastingLogs, fetchRewards, fetchPrayerLogs]);

  // Premium tables are only read once the account can see them.
  useEffect(() => {
    if (canAccessSunat) fetchSunatLogs({ silent: true });
    if (canAccessQuran) fetchQuranLogs({ silent: true });
    if (canAccessDoa) fetchDoaLogs({ silent: true });
  }, [canAccessSunat, canAccessQuran, canAccessDoa, fetchSunatLogs, fetchQuranLogs, fetchDoaLogs]);

  useRefetchOnForeground(() => {
    fetchFastingLogs({ silent: true });
    fetchPrayerLogs({ silent: true });
    if (canAccessSunat) fetchSunatLogs({ silent: true });
    if (canAccessQuran) fetchQuranLogs({ silent: true });
    if (canAccessDoa) fetchDoaLogs({ silent: true });
  });

  const today = new Date();
  const currentYear = today.getFullYear();
  const stats = calculateStats();
  const totalPrayers = getTotalPrayerCount(currentYear);
  const rewardType = rewards?.reward_type ?? 'money';
  const { currentStreak } = useStreak(id);

  const yearStart = new Date(currentYear, 0, 1);
  const daysElapsed = Math.max(1, Math.floor((today.getTime() - yearStart.getTime()) / 86400000) + 1);
  const possiblePrayersSoFar = daysElapsed * 5;

  const sunatDates = getSunatDates(currentYear);
  const sunatTarget = sunatDates.isnin_khamis.length + SYAWAL_TARGET + sunatDates.arafah.length;

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
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {child?.name || 'Child'}
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {getRamadanLabel(getCurrentSeason())}
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
              total={RAMADAN_DAYS}
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
            {canAccessStreak && currentStreak > 0 && (
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
              current={canAccessSunat ? calculateSunatStats(currentYear).total : 0}
              total={sunatTarget}
              locked={!canAccessSunat}
              onPress={() => router.push(`/child/${id}/sunat`)}
            />

            <TrackerCard
              label="Quran Reading"
              icon="book"
              color={colors.quranColor}
              muted={colors.quranMuted}
              current={canAccessQuran ? calculateQuranStats(currentYear).totalPages : 0}
              total={QURAN_TOTAL_PAGES}
              locked={!canAccessQuran}
              onPress={() => router.push(`/child/${id}/quran`)}
            />

            <TrackerCard
              label="Doa Harian"
              icon="heart"
              color={colors.doaColor}
              muted={colors.doaMuted}
              current={canAccessDoa ? calculateDoaStats(currentYear).total : 0}
              total={daysElapsed * DOA_ITEMS.length}
              locked={!canAccessDoa}
              onPress={() => router.push(`/child/${id}/doa`)}
            />

            {canExportReport && (
              <TouchableOpacity
                style={[styles.reportBtn, { backgroundColor: colors.primaryMuted }]}
                onPress={handleExportReport}
                disabled={isGenerating}
                accessibilityRole="button"
              >
                {isGenerating ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="document-text-outline" size={20} color={colors.text} />
                    <Text style={[styles.reportText, { color: colors.text }]}>Export Progress Report</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  reportText: { ...typography.subhead, fontWeight: '700' },
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
