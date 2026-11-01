import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Activity } from '@/data/games/schema';
import { useGameAudio } from '@/hooks/use-game-audio';
import { useGameSettings } from '@/hooks/use-game-settings';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { IconCircleButton } from './icon-circle-button';
import { PillButton } from './pill-button';

interface IntroScreenProps {
  activity: Activity;
  onStart: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ activity, onStart }) => {
  const { game } = useTheme();
  const { language, t } = useGameSettings();
  const { say, canSpeak, muted } = useGameAudio();
  const instructions = activity.instructions[language];

  useEffect(() => {
    say(instructions);
  }, [instructions, say]);

  return (
    <View style={styles.container}>
      <View style={[styles.tile, { backgroundColor: game.tiles[activity.tint], shadowColor: game.shadow }]}>
        <Text style={styles.emoji}>{activity.emoji}</Text>
      </View>
      <Text style={[styles.title, { color: game.text }]} accessibilityRole="header">
        {activity.title[language]}
      </Text>
      <Text style={[styles.instructions, { color: game.textSecondary }]}>{instructions}</Text>

      {canSpeak && !muted ? (
        <IconCircleButton icon="volume-high" label={t.listen} onPress={() => say(instructions)} size={60} />
      ) : (
        !canSpeak && <Text style={[styles.note, { color: game.textSecondary }]}>{t.noSpeech}</Text>
      )}

      <PillButton label={t.start} icon="play" onPress={onStart} style={styles.start} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  tile: {
    width: 168,
    height: 168,
    borderRadius: borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  emoji: { fontSize: 88, lineHeight: 104 },
  title: { ...typography.title1, textAlign: 'center' },
  instructions: { ...typography.callout, textAlign: 'center', maxWidth: 340 },
  note: { ...typography.footnote, textAlign: 'center', maxWidth: 320 },
  start: { alignSelf: 'stretch', marginTop: spacing.md },
});
