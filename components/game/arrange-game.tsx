import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ArrangeLetter, ArrangeQuestion } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing } from '@/constants/theme';
import { ItemVisual } from './item-visual';
import { GAME_MAX_WIDTH, GameProps } from './types';

export const ArrangeGame: React.FC<GameProps<ArrangeQuestion>> = ({ question, hintLevel, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);

  const contentWidth = Math.min(width, GAME_MAX_WIDTH) - spacing.xl * 2;
  const cell = Math.min(60, (contentWidth - spacing.xs * (question.word.length - 1)) / question.word.length);
  const nextLetter = question.word[placedIds.length];

  const handlePress = (entry: ArrangeLetter) => {
    if (solved || placedIds.includes(entry.id)) return;
    // Compares letters, not ids, so either A in a word with two As is accepted.
    if (entry.letter === nextLetter) {
      const nextPlaced = [...placedIds, entry.id];
      setPlacedIds(nextPlaced);
      setWrongId(null);
      const isDone = nextPlaced.length === question.word.length;
      report({ correct: true, solved: isDone, speak: isDone ? question.item.label : entry.letter });
    } else {
      setWrongId(entry.id);
      report({ correct: false, speak: entry.letter });
    }
  };

  const hintedId =
    hintLevel > 0
      ? question.letters.find((entry) => !placedIds.includes(entry.id) && entry.letter === nextLetter)?.id
      : undefined;

  return (
    <View style={styles.container}>
      <LinearGradient colors={game.sceneGradient} style={styles.panel}>
        <ItemVisual item={question.item} size={Math.min(96, height * 0.12)} />
      </LinearGradient>

      <View style={styles.slots}>
        {question.word.split('').map((letter, i) => {
          const isFilled = i < placedIds.length;
          return (
            <View
              key={i}
              style={[
                styles.slot,
                {
                  width: cell,
                  height: cell + 8,
                  backgroundColor: isFilled ? game.primaryMuted : game.surface,
                  borderColor: i === placedIds.length ? game.primary : game.outline,
                },
              ]}
            >
              <Text style={[styles.letter, { color: game.text, fontSize: cell * 0.56 }]}>{isFilled ? letter : ''}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.letters}>
        {question.letters.map((entry) => {
          const isPlaced = placedIds.includes(entry.id);
          const isHinted = hintedId === entry.id;
          const isWrong = wrongId === entry.id;
          return (
            <Pressable
              key={entry.id}
              onPress={() => handlePress(entry)}
              disabled={isPlaced}
              accessibilityRole="button"
              accessibilityLabel={entry.letter}
              accessibilityState={{ disabled: isPlaced }}
              style={[
                styles.tile,
                {
                  backgroundColor: game.tiles.yellow,
                  borderColor: isHinted ? game.primary : isWrong ? game.gentle : 'transparent',
                  opacity: isPlaced ? 0.2 : 1,
                  shadowColor: game.shadow,
                },
              ]}
            >
              <Text style={[styles.letter, { color: game.text, fontSize: 30 }]}>{entry.letter}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  panel: { borderRadius: borderRadius.xl, paddingVertical: spacing.md, alignItems: 'center' },
  slots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  slot: { borderWidth: 2, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  letter: { fontWeight: '800', includeFontPadding: false },
  letters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  tile: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
});
