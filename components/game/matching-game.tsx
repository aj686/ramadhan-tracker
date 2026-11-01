import React, { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { MatchPair, MatchQuestion } from '@/data/games/schema';
import { spacing } from '@/constants/theme';
import { AnswerCard, AnswerState } from './answer-card';
import { GAME_MAX_WIDTH, GameProps } from './types';

const GAP = spacing.lg;
const SIDE_PADDING = spacing.xl;

type Side = 'left' | 'right';

// Tap one card on each side, in either order. Works the same with a finger, mouse or switch control.
export const MatchingGame: React.FC<GameProps<MatchQuestion>> = ({ question, language, hintLevel, solved, report }) => {
  const { width, height } = useWindowDimensions();
  const [matched, setMatched] = useState<string[]>([]);
  const [selected, setSelected] = useState<{ side: Side; pairId: string } | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);

  const contentWidth = Math.min(width, GAME_MAX_WIDTH) - SIDE_PADDING * 2;
  const cardWidth = (contentWidth - GAP) / 2;
  const rows = question.pairs.length;
  const visualSize = Math.max(40, Math.min(cardWidth * 0.42, (height - 320) / rows - 40));

  const rightPairs = question.rightOrder
    .map((id) => question.pairs.find((pair) => pair.id === id))
    .filter((pair): pair is MatchPair => pair !== undefined);

  const hintedPairId =
    hintLevel > 0 ? selected?.pairId ?? question.pairs.find((pair) => !matched.includes(pair.id))?.id : undefined;

  const handlePress = (side: Side, pair: MatchPair) => {
    if (solved || matched.includes(pair.id)) return;
    setWrong(null);

    if (!selected || selected.side === side) {
      setSelected({ side, pairId: pair.id });
      return;
    }

    if (selected.pairId === pair.id) {
      const nextMatched = [...matched, pair.id];
      setMatched(nextMatched);
      setSelected(null);
      report({
        correct: true,
        solved: nextMatched.length === question.pairs.length,
        speak: pair.right.label,
      });
    } else {
      setWrong(`${side}-${pair.id}`);
      setSelected(null);
      report({ correct: false });
    }
  };

  const stateFor = (side: Side, pair: MatchPair): AnswerState => {
    if (matched.includes(pair.id)) return 'done';
    if (wrong === `${side}-${pair.id}`) return 'wrong';
    if (selected?.side === side && selected.pairId === pair.id) return 'selected';
    if (hintedPairId === pair.id) return 'hinted';
    return 'idle';
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.columns}>
        <View style={styles.column}>
          {question.pairs.map((pair, i) => (
            <AnswerCard
              key={pair.left.id}
              item={pair.left}
              language={language}
              state={stateFor('left', pair)}
              width={cardWidth}
              visualSize={visualSize}
              tintIndex={i}
              showLabel={false}
              onPress={() => handlePress('left', pair)}
            />
          ))}
        </View>
        <View style={styles.column}>
          {rightPairs.map((pair, i) => (
            <AnswerCard
              key={pair.right.id}
              item={pair.right}
              language={language}
              state={stateFor('right', pair)}
              width={cardWidth}
              visualSize={visualSize}
              tintIndex={i + 1}
              showLabel={false}
              silhouette={pair.rightSilhouette}
              onPress={() => handlePress('right', pair)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SIDE_PADDING, paddingVertical: spacing.md },
  columns: { flexDirection: 'row', justifyContent: 'center', gap: GAP },
  column: { gap: spacing.md },
});
