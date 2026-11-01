import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LETTER_STROKES } from '@/data/games/letter-strokes';
import type { TraceQuestion } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { advanceCheckpoint, Point, samplePolyline } from '@/services/game/geometry';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { ItemVisual } from './item-visual';
import { LineSegment } from './line-segment';
import { TouchCanvas } from './touch-canvas';
import { GAME_MAX_WIDTH, GameProps } from './types';

const CHECKPOINT_STEP = 12;
const TOLERANCE = 18; // generous: this is for ages 2–3, and there is no way to fail

const toPoints = (stroke: readonly (readonly [number, number])[]): Point[] =>
  stroke.map(([x, y]) => ({ x, y }));

// TracingCanvas: one letter at a time, stroke by stroke.
export const TracingGame: React.FC<GameProps<TraceQuestion>> = ({ question, language, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [letterIndex, setLetterIndex] = useState(0);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [reached, setReached] = useState(0);

  const size = Math.min(Math.min(width, GAME_MAX_WIDTH) - spacing.xxxl * 2, height * 0.42);
  const scale = size / 100;
  const thickness = size * 0.1;

  const letter = question.word[letterIndex] ?? question.word[question.word.length - 1];
  const strokes = useMemo(() => LETTER_STROKES[letter] ?? [], [letter]);
  const checkpoints = useMemo(
    () => samplePolyline(strokes[strokeIndex] ?? [], CHECKPOINT_STEP),
    [strokes, strokeIndex],
  );

  const handleTouch = (finger: Point) => {
    if (solved || checkpoints.length === 0) return;
    const nextReached = advanceCheckpoint(checkpoints, reached, finger, TOLERANCE, 3);
    if (nextReached === reached) return;

    if (nextReached < checkpoints.length - 1) {
      setReached(nextReached);
      return;
    }

    if (strokeIndex < strokes.length - 1) {
      setStrokeIndex(strokeIndex + 1);
      setReached(0);
      return;
    }

    if (letterIndex < question.word.length - 1) {
      setLetterIndex(letterIndex + 1);
      setStrokeIndex(0);
      setReached(0);
      report({ correct: true, speak: letter });
    } else {
      setReached(nextReached);
      report({ correct: true, solved: true, speak: question.item?.label });
    }
  };

  const nextDot = checkpoints[solved ? checkpoints.length - 1 : reached] ?? { x: 50, y: 50 };

  return (
    <View style={styles.container}>
      <View style={styles.wordRow}>
        {question.item && <ItemVisual item={question.item} size={44} />}
        {question.word.split('').map((character, i) => (
          <View
            key={i}
            style={[
              styles.wordCell,
              { backgroundColor: i < letterIndex || solved ? game.primaryMuted : i === letterIndex ? game.tiles.yellow : game.surface },
            ]}
          >
            <Text style={[styles.wordLetter, { color: game.text }]}>{character}</Text>
          </View>
        ))}
      </View>

      <TouchCanvas
        size={size}
        label={letter}
        onTouch={handleTouch}
        style={[styles.canvas, { backgroundColor: game.surface, borderColor: game.outline, shadowColor: game.shadow }]}
      >
        {strokes.flatMap((stroke, s) =>
          toPoints(stroke).slice(1).map((point, i) => (
            <LineSegment
              key={`guide-${language}-${s}-${i}`}
              from={toPoints(stroke)[i]}
              to={point}
              scale={scale}
              thickness={thickness}
              color={game.backgroundAlt}
            />
          )),
        )}

        {strokes.slice(0, strokeIndex).flatMap((stroke, s) =>
          toPoints(stroke).slice(1).map((point, i) => (
            <LineSegment
              key={`done-${s}-${i}`}
              from={toPoints(stroke)[i]}
              to={point}
              scale={scale}
              thickness={thickness * 0.72}
              color={game.primary}
            />
          )),
        )}

        {checkpoints.slice(1, reached + 1).map((point, i) => (
          <LineSegment
            key={`ink-${i}`}
            from={checkpoints[i]}
            to={point}
            scale={scale}
            thickness={thickness * 0.72}
            color={game.primary}
          />
        ))}

        {!solved && (
          <View
            style={[
              styles.nextDot,
              {
                left: nextDot.x * scale - 15,
                top: nextDot.y * scale - 15,
                backgroundColor: game.highlight,
                borderColor: game.primary,
              },
            ]}
          />
        )}
      </TouchCanvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: spacing.md },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wordCell: {
    width: 40,
    height: 44,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordLetter: { ...typography.title3, fontWeight: '800' },
  canvas: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  nextDot: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
});
