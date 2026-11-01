import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Activity } from '@/data/games/schema';
import { useGameSettings } from '@/hooks/use-game-settings';
import { useTheme } from '@/hooks/use-theme';
import { spacing, typography } from '@/constants/theme';
import { PillButton } from './pill-button';
import { NATIVE_DRIVER } from './types';

const MAX_STARS = 3;

interface CompletionScreenProps {
  activity: Activity;
  stars: number;
  firstTry: number;
  total: number;
  onReplay: () => void;
  onBack: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  activity,
  stars,
  firstTry,
  total,
  onReplay,
  onBack,
}) => {
  const { game } = useTheme();
  const { language, t } = useGameSettings();
  const [scales] = useState(() => Array.from({ length: MAX_STARS }, () => new Animated.Value(0)));

  useEffect(() => {
    Animated.stagger(
      180,
      scales.map((scale) => Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE_DRIVER, bounciness: 14 })),
    ).start();
  }, [scales]);

  return (
    <View style={styles.container}>
      <View style={styles.stars} accessibilityLabel={t.starsEarned(stars)}>
        {scales.map((scale, i) => (
          <Animated.View key={i} style={{ transform: [{ scale }, { translateY: i === 1 ? -14 : 0 }] }}>
            <Ionicons name="star" size={i === 1 ? 84 : 66} color={i < stars ? game.star : game.starEmpty} />
          </Animated.View>
        ))}
      </View>

      <Text style={[styles.title, { color: game.text }]} accessibilityRole="header">
        {t.completeTitle(stars)}
      </Text>
      <Text style={[styles.activity, { color: game.textSecondary }]}>{activity.title[language]}</Text>
      <Text style={[styles.score, { color: game.primary }]}>{t.scoreLine(firstTry, total)}</Text>

      <View style={styles.actions}>
        <PillButton label={t.replay} icon="refresh" onPress={onReplay} />
        <PillButton label={t.backToCategory} variant="light" onPress={onBack} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  stars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.lg },
  title: { ...typography.largeTitle, textAlign: 'center' },
  activity: { ...typography.callout, textAlign: 'center' },
  score: { ...typography.headline, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.xl },
});
