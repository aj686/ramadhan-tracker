import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FeedbackState } from '@/hooks/use-game-session';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface FeedbackBannerProps {
  feedback: FeedbackState;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ feedback }) => {
  const { game } = useTheme();
  if (feedback.kind === 'none') return null;

  const isCorrect = feedback.kind === 'correct';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: isCorrect ? game.correctMuted : game.gentleMuted }]}
    >
      <Ionicons
        name={isCorrect ? 'happy' : 'heart'}
        size={22}
        color={isCorrect ? game.correct : game.gentle}
      />
      <Text style={[styles.text, { color: isCorrect ? game.correct : game.gentle }]}>{feedback.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
  },
  text: { ...typography.headline, fontWeight: '700' },
});
