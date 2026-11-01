import React, { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { DOT_FIGURES } from '@/data/games/figures';
import type { DotsQuestion } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { distance, Point } from '@/services/game/geometry';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { LineSegment } from './line-segment';
import { TouchCanvas } from './touch-canvas';
import { GAME_MAX_WIDTH, GameProps } from './types';

const HIT_RADIUS = 11;
const DOT_SIZE = 34;

export const DotsGame: React.FC<GameProps<DotsQuestion>> = ({ question, language, hintLevel, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [connected, setConnected] = useState(0);

  const figure = DOT_FIGURES[question.figureId];
  const size = Math.min(Math.min(width, GAME_MAX_WIDTH) - spacing.xxxl * 2, height * 0.46);
  const scale = size / 100;

  const handleTouch = (finger: Point, isStart: boolean) => {
    if (solved) return;

    const target = figure.points[connected];
    if (target && distance(target, finger) <= HIT_RADIUS) {
      const nextConnected = connected + 1;
      setConnected(nextConnected);
      const isDone = nextConnected === figure.points.length;
      report({
        correct: true,
        solved: isDone,
        speak: isDone ? figure.label : String(nextConnected),
      });
      return;
    }

    // Only a fresh tap on the wrong number counts as a try. Sliding over one on the way does not.
    if (isStart) {
      const touchedWrongDot = figure.points.some(
        (point, i) => i > connected && distance(point, finger) <= HIT_RADIUS,
      );
      if (touchedWrongDot) report({ correct: false });
    }
  };

  const hintedIndex = hintLevel > 0 ? connected : -1;

  return (
    <View style={styles.container}>
      <TouchCanvas
        size={size}
        label={figure.label[language]}
        onTouch={handleTouch}
        style={[styles.canvas, { backgroundColor: game.surface, borderColor: game.outline, shadowColor: game.shadow }]}
      >
        {figure.points.slice(1, Math.max(connected, 1)).map((point, i) => (
          <LineSegment
            key={i}
            from={figure.points[i]}
            to={point}
            scale={scale}
            thickness={6}
            color={game.primary}
          />
        ))}
        {solved && (
          <LineSegment
            from={figure.points[figure.points.length - 1]}
            to={figure.points[0]}
            scale={scale}
            thickness={6}
            color={game.primary}
          />
        )}

        {figure.points.map((point, i) => {
          const isDone = i < connected;
          const isNext = i === connected || i === hintedIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: point.x * scale - DOT_SIZE / 2,
                  top: point.y * scale - DOT_SIZE / 2,
                  backgroundColor: isDone ? game.primary : isNext ? game.highlight : game.backgroundAlt,
                  borderColor: isNext ? game.primary : 'transparent',
                },
              ]}
            >
              <Text selectable={false} style={[styles.dotText, { color: isDone ? game.onPrimary : game.text }]}>
                {i + 1}
              </Text>
            </View>
          );
        })}

        {solved && (
          <View style={styles.reveal}>
            <Text style={styles.revealEmoji}>{figure.emoji}</Text>
          </View>
        )}
      </TouchCanvas>

      {solved && (
        <Text style={[styles.revealLabel, { color: game.text }]}>{figure.label[language]}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: spacing.md },
  canvas: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 14, fontWeight: '800' },
  reveal: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  revealEmoji: { fontSize: 72 },
  revealLabel: { ...typography.title2 },
});
