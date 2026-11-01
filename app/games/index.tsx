import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameHeader } from '@/components/game/game-header';
import { GameLayout } from '@/components/game/game-layout';
import { ParentalGate } from '@/components/game/parental-gate';
import { PillButton } from '@/components/game/pill-button';
import { ProgressBar } from '@/components/progress-bar';
import { ACTIVITIES, JOURNEYS_BY_AGE } from '@/data/games/activities';
import type { AgeGroup, JourneyId, TileTint } from '@/data/games/schema';
import { useChildren } from '@/hooks/use-children';
import { useGameProgress } from '@/hooks/use-game-progress';
import { useGameSettings } from '@/hooks/use-game-settings';
import { useTheme } from '@/hooks/use-theme';
import { pickNextActivity, summarizeByJourney, summarizeProgress } from '@/services/game/progress';
import { borderRadius, spacing, typography } from '@/constants/theme';

const AGE_CARDS: { age: AgeGroup; emoji: string; tint: TileTint }[] = [
  { age: 'toddler', emoji: '🐣', tint: 'yellow' },
  { age: 'preschool', emoji: '🐱', tint: 'blue' },
];

const JOURNEY_ART: Record<JourneyId, { emoji: string; tint: TileTint }> = {
  fundamentals: { emoji: '🔤', tint: 'yellow' },
  activities: { emoji: '🖍️', tint: 'pink' },
  kembara: { emoji: '🧩', tint: 'purple' },
  little_step: { emoji: '👣', tint: 'green' },
};

export default function GamesHomeScreen() {
  const { game } = useTheme();
  const router = useRouter();
  const { t, language, ageGroup, activeChildId, setAgeGroup, setActiveChildId } = useGameSettings();
  const { children, fetchChildren } = useChildren();
  const { profile } = useGameProgress();
  const [isGateOpen, setIsGateOpen] = useState(false);

  useEffect(() => {
    fetchChildren({ silent: true });
  }, [fetchChildren]);

  // Android's back button goes through the same parent check as the on-screen one.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        setIsGateOpen(true);
        return true;
      });
      return () => subscription.remove();
    }, []),
  );

  const activeChild = children.find((child) => child.id === activeChildId) ?? null;
  const journeys = JOURNEYS_BY_AGE[ageGroup];
  const ageActivities = useMemo(() => ACTIVITIES.filter((activity) => activity.age === ageGroup), [ageGroup]);
  const overall = useMemo(() => summarizeProgress(profile, ageActivities), [profile, ageActivities]);
  const byJourney = useMemo(() => summarizeByJourney(profile, journeys, ageActivities), [profile, journeys, ageActivities]);
  const challenge = useMemo(() => pickNextActivity(profile, ageActivities), [profile, ageActivities]);

  return (
    <GameLayout>
      <GameHeader onBack={() => setIsGateOpen(true)} backLabel={t.back} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <View style={[styles.avatar, { backgroundColor: game.tiles.orange }]}>
            <Text style={styles.avatarEmoji}>🐱</Text>
          </View>
          <View style={styles.greetingText}>
            <Text style={[styles.hello, { color: game.text }]} numberOfLines={1}>
              {t.greeting(activeChild?.name ?? null)}
            </Text>
            <Text style={[styles.subHello, { color: game.textSecondary }]}>{t.letsLearn}</Text>
          </View>
        </View>

        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: game.textSecondary }]}>{t.whoIsPlaying}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Pressable
                onPress={() => setActiveChildId(null)}
                accessibilityRole="button"
                accessibilityState={{ selected: activeChildId === null }}
                style={[styles.chip, { backgroundColor: activeChildId === null ? game.primary : game.surface }]}
              >
                <Text style={[styles.chipText, { color: activeChildId === null ? game.onPrimary : game.text }]}>
                  {t.guest}
                </Text>
              </Pressable>
              {children.map((child) => {
                const isActive = child.id === activeChildId;
                return (
                  <Pressable
                    key={child.id}
                    onPress={() => setActiveChildId(child.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.chip, { backgroundColor: isActive ? game.primary : game.surface }]}
                  >
                    <Text style={[styles.chipText, { color: isActive ? game.onPrimary : game.text }]}>{child.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: game.text }]}>{t.chooseAge}</Text>
          <View style={styles.ageRow}>
            {AGE_CARDS.map(({ age, emoji, tint }) => {
              const isActive = age === ageGroup;
              return (
                <Pressable
                  key={age}
                  onPress={() => setAgeGroup(age)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  style={[
                    styles.ageCard,
                    {
                      backgroundColor: game.tiles[tint],
                      borderColor: isActive ? game.primary : 'transparent',
                      shadowColor: game.shadow,
                    },
                  ]}
                >
                  <Text style={styles.ageEmoji}>{emoji}</Text>
                  <Text style={[styles.ageName, { color: game.text }]}>{t.ages[age].name}</Text>
                  <Text style={[styles.ageRange, { color: game.text }]}>{t.ages[age].range}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {challenge && (
          <LinearGradient
            colors={game.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroText}>
              <Text style={[styles.heroTitle, { color: game.onPrimary }]}>{t.dailyChallenge}</Text>
              <Text style={[styles.heroBody, { color: game.onPrimary }]}>
                {t.dailyChallengeBody(challenge.title[language])}
              </Text>
              <PillButton
                label={t.letsGo}
                variant="light"
                onPress={() => router.push(`/games/play/${challenge.id}`)}
                style={styles.heroButton}
              />
            </View>
            <Text style={styles.heroEmoji}>🏆</Text>
          </LinearGradient>
        )}

        <View style={[styles.progressCard, { backgroundColor: game.surface, shadowColor: game.shadow }]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressTitle, { color: game.text }]}>{t.yourProgress}</Text>
            <View style={styles.starCount}>
              <Ionicons name="star" size={18} color={game.star} />
              <Text style={[styles.progressTitle, { color: game.text }]}>{overall.stars}</Text>
            </View>
          </View>
          <ProgressBar
            progress={overall.total > 0 ? overall.completed / overall.total : 0}
            color={game.primary}
            trackColor={game.primaryMuted}
            height={8}
          />
          <Text style={[styles.progressSub, { color: game.textSecondary }]}>
            {t.gamesDone(overall.completed, overall.total)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: game.text }]}>{t.categories}</Text>
          <View style={styles.grid}>
            {journeys.map((journey) => {
              const art = JOURNEY_ART[journey];
              const summary = byJourney[journey];
              return (
                <Pressable
                  key={journey}
                  onPress={() => router.push(`/games/journey/${journey}`)}
                  accessibilityRole="button"
                  accessibilityLabel={t.journeys[journey]}
                  style={[styles.categoryCard, { backgroundColor: game.surface, shadowColor: game.shadow }]}
                >
                  <View style={[styles.categoryArt, { backgroundColor: game.tiles[art.tint] }]}>
                    <Text style={styles.categoryEmoji}>{art.emoji}</Text>
                  </View>
                  <View style={styles.categoryLabel}>
                    <Text style={[styles.categoryTitle, { color: game.text }]} numberOfLines={2}>
                      {t.journeys[journey]}
                    </Text>
                    <Text style={[styles.categorySub, { color: game.textSecondary }]}>
                      {t.gamesDone(summary.completed, summary.total)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <ParentalGate
        visible={isGateOpen}
        onCancel={() => setIsGateOpen(false)}
        onPass={() => {
          setIsGateOpen(false);
          router.replace('/(tabs)/learn');
        }}
      />
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 32, lineHeight: 38 },
  greetingText: { flex: 1 },
  hello: { ...typography.title2, fontWeight: '800' },
  subHello: { ...typography.footnote },
  section: { gap: spacing.sm },
  sectionLabel: { ...typography.footnote, fontWeight: '600' },
  sectionTitle: { ...typography.title3, fontWeight: '800' },
  chips: { gap: spacing.sm },
  chip: { minHeight: 44, paddingHorizontal: spacing.lg, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chipText: { ...typography.subhead, fontWeight: '700' },
  ageRow: { flexDirection: 'row', gap: spacing.md },
  ageCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 3,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  ageEmoji: { fontSize: 44, lineHeight: 54 },
  ageName: { ...typography.subhead, fontWeight: '800', textAlign: 'center' },
  ageRange: { ...typography.caption, textAlign: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.xxl, padding: spacing.xl, gap: spacing.sm },
  heroText: { flex: 1, gap: spacing.sm },
  heroTitle: { ...typography.title2, fontWeight: '800' },
  heroBody: { ...typography.footnote },
  heroButton: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: spacing.xl, marginTop: spacing.xs },
  heroEmoji: { fontSize: 72, lineHeight: 86 },
  progressCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { ...typography.headline, fontWeight: '700' },
  starCount: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  progressSub: { ...typography.caption },
  grid: { flexDirection: 'row', gap: spacing.md },
  categoryCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  categoryArt: { height: 110, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 58, lineHeight: 70 },
  categoryLabel: { padding: spacing.md, gap: 2 },
  categoryTitle: { ...typography.subhead, fontWeight: '800', textAlign: 'center' },
  categorySub: { ...typography.caption, textAlign: 'center' },
});
