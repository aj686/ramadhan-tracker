import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GameHeader } from '@/components/game/game-header';
import { GameLayout } from '@/components/game/game-layout';
import { GAME_MAX_WIDTH } from '@/components/game/types';
import { ProgressBar } from '@/components/progress-bar';
import { getJourneyActivities } from '@/data/games/activities';
import type { JourneyId } from '@/data/games/schema';
import { useGameProgress } from '@/hooks/use-game-progress';
import { useGameSettings } from '@/hooks/use-game-settings';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { summarizeProgress } from '@/services/game/progress';
import { borderRadius, spacing, typography } from '@/constants/theme';

const GAP = spacing.md;
const SIDE_PADDING = spacing.xl;
const MAX_STARS = 3;

export default function JourneyScreen() {
  const { journey } = useLocalSearchParams<{ journey: string }>();
  const { game } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const goBack = useGoBack('/games');
  const { t, language } = useGameSettings();
  const { profile } = useGameProgress();

  const journeyId = journey as JourneyId;
  const activities = useMemo(() => getJourneyActivities(journeyId), [journeyId]);
  const summary = useMemo(() => summarizeProgress(profile, activities), [profile, activities]);
  const cardWidth = (Math.min(width, GAME_MAX_WIDTH) - SIDE_PADDING * 2 - GAP) / 2;

  return (
    <GameLayout>
      <GameHeader onBack={goBack} backLabel={t.back} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: game.text }]} accessibilityRole="header">
          {t.journeys[journeyId] ?? t.categories}
        </Text>

        <View style={styles.summary}>
          <ProgressBar
            progress={summary.total > 0 ? summary.completed / summary.total : 0}
            color={game.primary}
            trackColor={game.primaryMuted}
            height={8}
          />
          <Text style={[styles.summaryText, { color: game.textSecondary }]}>
            {t.gamesDone(summary.completed, summary.total)} · {t.starsEarned(summary.stars)}
          </Text>
        </View>

        <View style={styles.grid}>
          {activities.map((activity) => {
            const bestStars = profile[activity.id]?.bestStars ?? 0;
            return (
              <Pressable
                key={activity.id}
                onPress={() => router.push(`/games/play/${activity.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${activity.title[language]}, ${t.starsEarned(bestStars)}`}
                style={[styles.card, { width: cardWidth, backgroundColor: game.surface, shadowColor: game.shadow }]}
              >
                <View style={[styles.art, { backgroundColor: game.tiles[activity.tint] }]}>
                  <Text style={styles.emoji}>{activity.emoji}</Text>
                </View>
                <View style={styles.label}>
                  <Text style={[styles.cardTitle, { color: game.text }]} numberOfLines={2}>
                    {activity.title[language]}
                  </Text>
                  <View style={styles.stars}>
                    {Array.from({ length: MAX_STARS }, (_, i) => (
                      <Ionicons key={i} name="star" size={16} color={i < bestStars ? game.star : game.starEmpty} />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </GameLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: SIDE_PADDING, paddingBottom: spacing.xxxl, gap: spacing.md },
  title: { ...typography.title2, fontWeight: '800' },
  summary: { gap: spacing.xs },
  summaryText: { ...typography.footnote },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  art: { height: 108, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, lineHeight: 68 },
  label: { padding: spacing.md, gap: spacing.xs, alignItems: 'center' },
  cardTitle: { ...typography.subhead, fontWeight: '800', textAlign: 'center', minHeight: 40 },
  stars: { flexDirection: 'row', gap: 2 },
});
