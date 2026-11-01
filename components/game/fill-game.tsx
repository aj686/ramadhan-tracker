import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LETTER_STROKES } from '@/data/games/letter-strokes';
import type { FillQuestion } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { distance, Point, samplePolyline } from '@/services/game/geometry';
import { borderRadius, spacing } from '@/constants/theme';
import { TouchCanvas } from './touch-canvas';
import { GAME_MAX_WIDTH, GameProps, MIN_TOUCH_TARGET } from './types';

const BLOB_STEP = 9;
const BLOB_INSET = 7;
const PAINT_RADIUS = 13;

// Colour the Letters: the letter is made of soft blobs. Rubbing a finger over them paints them.
export const FillGame: React.FC<GameProps<FillQuestion>> = ({ question, language, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [activeColor, setActiveColor] = useState(question.palette[0]?.color ?? game.primary);
  const [painted, setPainted] = useState<Record<number, string>>({});

  const size = Math.min(Math.min(width, GAME_MAX_WIDTH) - spacing.xxxl * 2, height * 0.42);
  const scale = size / 100;
  const blobSize = size * 0.13;

  // Pulled in from the edges, because a blob is wider than the thin stroke it sits on.
  const blobs: Point[] = useMemo(
    () =>
      (LETTER_STROKES[question.letter] ?? [])
        .flatMap((stroke) => samplePolyline(stroke, BLOB_STEP))
        .map(({ x, y }) => ({
          x: BLOB_INSET + x * (1 - (BLOB_INSET * 2) / 100),
          y: BLOB_INSET + y * (1 - (BLOB_INSET * 2) / 100),
        })),
    [question.letter],
  );

  const handleTouch = (finger: Point) => {
    if (solved) return;
    const reachedNow = blobs
      .map((blob, i) => ({ blob, i }))
      .filter(({ blob, i }) => painted[i] === undefined && distance(blob, finger) <= PAINT_RADIUS);
    if (reachedNow.length === 0) return;

    const nextPainted = { ...painted };
    reachedNow.forEach(({ i }) => {
      nextPainted[i] = activeColor;
    });
    setPainted(nextPainted);

    if (Object.keys(nextPainted).length === blobs.length) {
      report({ correct: true, solved: true, speak: question.letter });
    }
  };

  return (
    <View style={styles.container}>
      <TouchCanvas
        size={size}
        label={question.letter}
        onTouch={handleTouch}
        style={[styles.canvas, { backgroundColor: game.surface, borderColor: game.outline, shadowColor: game.shadow }]}
      >
        {blobs.map((blob, i) => (
          <View
            key={`${language}-${i}`}
            style={{
              position: 'absolute',
              left: blob.x * scale - blobSize / 2,
              top: blob.y * scale - blobSize / 2,
              width: blobSize,
              height: blobSize,
              borderRadius: blobSize / 2,
              backgroundColor: painted[i] ?? game.backgroundAlt,
            }}
          />
        ))}
      </TouchCanvas>

      <View style={styles.palette}>
        {question.palette.map((colour) => {
          const isActive = colour.color === activeColor;
          return (
            <Pressable
              key={colour.id}
              onPress={() => colour.color && setActiveColor(colour.color)}
              accessibilityRole="button"
              accessibilityLabel={colour.label[language]}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.swatch,
                { backgroundColor: colour.color, borderColor: isActive ? game.primary : game.surface },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: spacing.lg },
  canvas: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  palette: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  swatch: { width: MIN_TOUCH_TARGET - 8, height: MIN_TOUCH_TARGET - 8, borderRadius: MIN_TOUCH_TARGET, borderWidth: 5 },
});
