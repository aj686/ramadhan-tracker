import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ChoiceQuestion, GameItem } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { AnswerCard, AnswerState } from './answer-card';
import { ItemVisual } from './item-visual';
import { GAME_MAX_WIDTH, GameProps, MIN_TOUCH_TARGET } from './types';

const GAP = spacing.md;
const SIDE_PADDING = spacing.xl;

export const ChoiceGame: React.FC<GameProps<ChoiceQuestion>> = ({
  question,
  language,
  hintLevel,
  solved,
  report,
  canHear,
}) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  const contentWidth = Math.min(width, GAME_MAX_WIDTH) - SIDE_PADDING * 2;
  const cardWidth = (contentWidth - GAP) / 2;
  const hasPanel = question.scene !== undefined || question.listenOnly;
  const rows = Math.ceil(question.options.length / 2);
  const roomForCards = height - (hasPanel ? 400 : 300);
  const rowHeight = (roomForCards - GAP * (rows - 1)) / rows;
  // As big as fits, up to a square: fewer options means bigger targets for small hands.
  const cardHeight = Math.max(MIN_TOUCH_TARGET * 1.5, Math.min(cardWidth * 1.05, rowHeight));
  const visualSize = Math.max(48, Math.min(cardWidth * 0.62, cardHeight - (question.showLabels ? 72 : 36)));

  // A hint removes wrong options one at a time, in a stable order.
  const hiddenIds = question.options
    .filter((option) => option.id !== question.answerId && !wrongIds.includes(option.id))
    .slice(0, hintLevel)
    .map((option) => option.id);

  const handlePress = (option: GameItem) => {
    if (solved) return;
    if (option.id === question.answerId) {
      report({ correct: true, solved: true, speak: question.scene?.label ?? option.label });
    } else if (!wrongIds.includes(option.id)) {
      setWrongIds((ids) => [...ids, option.id]);
      report({ correct: false, speak: option.label });
    }
  };

  const stateFor = (option: GameItem): AnswerState => {
    if (option.id === question.answerId) return solved ? 'correct' : 'idle';
    if (wrongIds.includes(option.id)) return 'wrong';
    return solved ? 'done' : 'idle';
  };

  const maskLetters = question.wordMask?.split('') ?? [];
  const revealed = question.revealWord?.split('') ?? [];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {question.listenOnly && !question.scene && (
        <LinearGradient colors={game.sceneGradient} style={styles.panel}>
          <Text style={styles.listenEmoji}>👂</Text>
          {!canHear && (
            <Text style={[styles.fallbackWord, { color: game.text }]}>{question.say[language]}</Text>
          )}
        </LinearGradient>
      )}

      {question.scene && (
        <LinearGradient colors={game.sceneGradient} style={styles.panel}>
          <ItemVisual item={question.scene} size={Math.min(96, height * 0.12)} />
        </LinearGradient>
      )}

      {maskLetters.length > 0 && (
        <View style={styles.mask} accessibilityLabel={solved ? question.revealWord : question.wordMask}>
          {maskLetters.map((letter, i) => {
            const isBlank = letter === '_';
            return (
              <View
                key={i}
                style={[
                  styles.maskCell,
                  {
                    backgroundColor: isBlank ? game.primaryMuted : game.surface,
                    borderColor: isBlank ? game.primary : game.outline,
                  },
                ]}
              >
                <Text style={[styles.maskLetter, { color: game.text }]}>
                  {isBlank ? (solved ? revealed[i] : '') : letter}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.grid}>
        {question.options
          .filter((option) => !hiddenIds.includes(option.id))
          .map((option, i) => (
            <AnswerCard
              key={option.id}
              item={option}
              language={language}
              state={stateFor(option)}
              width={cardWidth}
              minHeight={cardHeight}
              visualSize={visualSize}
              tintIndex={i}
              showLabel={question.showLabels}
              onPress={() => handlePress(option)}
            />
          ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // The vertical padding leaves room for a card's "correct" pop, which would otherwise clip.
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SIDE_PADDING,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  panel: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  listenEmoji: { fontSize: 52 },
  fallbackWord: { ...typography.title2, marginTop: spacing.xs },
  mask: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs },
  maskCell: {
    width: 42,
    height: 50,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskLetter: { fontSize: 26, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: GAP },
});
