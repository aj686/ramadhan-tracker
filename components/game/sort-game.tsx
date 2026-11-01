import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { SortQuestion, SortToken } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { Draggable } from './draggable';
import { GAME_MAX_WIDTH, GameProps } from './types';

const SIDE_PADDING = spacing.xl;

type Rect = { x: number; y: number; width: number; height: number };

// DragAndDropGame: drag each token into its bin. Tap a token, then a bin, also works.
export const SortGame: React.FC<GameProps<SortQuestion>> = ({ question, language, hintLevel, solved, report }) => {
  const { game } = useTheme();
  const { width } = useWindowDimensions();
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongBinId, setWrongBinId] = useState<string | null>(null);
  const binRefs = useRef<Record<string, View | null>>({});
  const binRects = useRef<Record<string, Rect>>({});

  const contentWidth = Math.min(width, GAME_MAX_WIDTH) - SIDE_PADDING * 2;
  const binWidth = (contentWidth - spacing.md * (question.bins.length - 1)) / question.bins.length;
  const tokenSize = Math.min(84, contentWidth / 4);

  const measureBins = () => {
    question.bins.forEach((bin) => {
      binRefs.current[bin.id]?.measureInWindow((x, y, w, h) => {
        binRects.current[bin.id] = { x, y, width: w, height: h };
      });
    });
  };

  const placeToken = (token: SortToken, binId: string) => {
    if (solved || placed[token.id]) return;
    setSelectedId(null);

    if (token.binId === binId) {
      const nextPlaced = { ...placed, [token.id]: binId };
      setPlaced(nextPlaced);
      setWrongBinId(null);
      report({
        correct: true,
        solved: Object.keys(nextPlaced).length === question.tokens.length,
        speak: token.item.label,
      });
    } else {
      setWrongBinId(binId);
      report({ correct: false, speak: token.item.label });
    }
  };

  const handleDrop = (token: SortToken, pageX: number, pageY: number) => {
    const hit = Object.entries(binRects.current).find(
      ([, rect]) =>
        pageX >= rect.x && pageX <= rect.x + rect.width && pageY >= rect.y && pageY <= rect.y + rect.height,
    );
    if (hit) placeToken(token, hit[0]);
  };

  const remaining = question.tokens.filter((token) => !placed[token.id]);
  const nextToken = remaining[0];

  return (
    <View style={styles.container}>
      <View style={styles.tokens}>
        {remaining.map((token) => (
          <Draggable
            key={token.id}
            label={token.item.label[language]}
            onDragStart={measureBins}
            onDrop={(x, y) => handleDrop(token, x, y)}
            onTap={() => setSelectedId(selectedId === token.id ? null : token.id)}
            style={{
              width: tokenSize,
              height: tokenSize,
              borderRadius: tokenSize / 2,
              backgroundColor: token.item.color,
              borderWidth: 4,
              borderColor: selectedId === token.id ? game.primary : game.surface,
              shadowColor: game.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 8,
            }}
          >
            <View />
          </Draggable>
        ))}
      </View>

      <View style={styles.bins} onLayout={measureBins}>
        {question.bins.map((bin) => {
          const count = question.tokens.filter((token) => placed[token.id] === bin.id).length;
          const isHinted = hintLevel > 0 && nextToken?.binId === bin.id;
          return (
            <Pressable
              key={bin.id}
              ref={(node) => {
                binRefs.current[bin.id] = node as View | null;
              }}
              onPress={() => {
                const token = question.tokens.find((t) => t.id === selectedId);
                if (token) placeToken(token, bin.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={bin.label[language]}
              style={[
                styles.bin,
                {
                  width: binWidth,
                  backgroundColor: game.surface,
                  borderColor: bin.color,
                  borderWidth: isHinted || wrongBinId === bin.id ? 6 : 4,
                  shadowColor: game.shadow,
                },
              ]}
            >
              <View style={[styles.binSwatch, { backgroundColor: bin.color }]} />
              <Text style={[styles.binLabel, { color: game.text }]} numberOfLines={1}>
                {bin.label[language]}
              </Text>
              <View style={styles.binBalls}>
                {Array.from({ length: count }, (_, i) => (
                  <View key={i} style={[styles.binBall, { backgroundColor: bin.color, borderColor: game.outline }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SIDE_PADDING, justifyContent: 'space-between', paddingBottom: spacing.md },
  tokens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: spacing.lg,
    minHeight: 180,
    paddingVertical: spacing.lg,
  },
  bins: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  bin: {
    minHeight: 150,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  binSwatch: { width: 44, height: 44, borderRadius: 22 },
  binLabel: { ...typography.subhead, fontWeight: '700' },
  binBalls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  binBall: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
});
