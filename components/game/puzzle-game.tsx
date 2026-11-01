import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PUZZLE_SCENES } from '@/data/games/figures';
import type { PuzzleQuestion } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing } from '@/constants/theme';
import { Draggable } from './draggable';
import { PuzzlePiece, PuzzleScene } from './puzzle-scene';
import { GAME_MAX_WIDTH, GameProps } from './types';

const TRAY_SCALE = 0.56;

type Rect = { x: number; y: number; width: number; height: number };

export const PuzzleGame: React.FC<GameProps<PuzzleQuestion>> = ({ question, language, hintLevel, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [placed, setPlaced] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const boardRef = useRef<View | null>(null);
  const boardRect = useRef<Rect | null>(null);

  const scene = PUZZLE_SCENES.find((candidate) => candidate.id === question.sceneId) ?? PUZZLE_SCENES[0];
  const boardSize = Math.min(Math.min(width, GAME_MAX_WIDTH) - spacing.xxxl * 2, height * 0.38);
  const traySize = boardSize * TRAY_SCALE;
  const count = question.cols * question.rows;
  const cellWidth = boardSize / question.cols;
  const cellHeight = boardSize / question.rows;

  const measureBoard = () => {
    boardRef.current?.measureInWindow((x, y, w, h) => {
      boardRect.current = { x, y, width: w, height: h };
    });
  };

  const tryPlace = (piece: number, cell: number) => {
    if (solved || placed.includes(piece)) return;
    setSelected(null);
    if (piece === cell) {
      const nextPlaced = [...placed, piece];
      setPlaced(nextPlaced);
      report({ correct: true, solved: nextPlaced.length === count, speak: nextPlaced.length === count ? scene.label : undefined });
    } else {
      report({ correct: false });
    }
  };

  const handleDrop = (piece: number, pageX: number, pageY: number) => {
    const rect = boardRect.current;
    if (!rect) return;
    const inside =
      pageX >= rect.x && pageX <= rect.x + rect.width && pageY >= rect.y && pageY <= rect.y + rect.height;
    if (!inside) return;
    const col = Math.min(question.cols - 1, Math.floor((pageX - rect.x) / cellWidth));
    const row = Math.min(question.rows - 1, Math.floor((pageY - rect.y) / cellHeight));
    tryPlace(piece, row * question.cols + col);
  };

  return (
    <View style={styles.container}>
      <View
        ref={boardRef}
        onLayout={measureBoard}
        style={[styles.board, { width: boardSize, height: boardSize, borderColor: game.primary, backgroundColor: game.backgroundAlt }]}
        accessibilityLabel={scene.label[language]}
      >
        {hintLevel > 0 && (
          <View style={styles.hintLayer}>
            <PuzzleScene scene={scene} size={boardSize} />
          </View>
        )}
        {Array.from({ length: count }, (_, cell) => {
          const col = cell % question.cols;
          const row = Math.floor(cell / question.cols);
          return (
            <Pressable
              key={cell}
              onPress={() => {
                if (selected !== null) tryPlace(selected, cell);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${row + 1}, ${col + 1}`}
              style={[
                styles.cell,
                { left: col * cellWidth, top: row * cellHeight, width: cellWidth, height: cellHeight, borderColor: game.outline },
              ]}
            >
              {placed.includes(cell) && (
                <PuzzlePiece scene={scene} size={boardSize} cols={question.cols} rows={question.rows} index={cell} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tray}>
        {question.pieceOrder
          .filter((piece) => !placed.includes(piece))
          .map((piece) => (
            <Draggable
              key={piece}
              label={`${scene.label[language]} ${piece + 1}`}
              onDragStart={measureBoard}
              onDrop={(x, y) => handleDrop(piece, x, y)}
              onTap={() => setSelected(selected === piece ? null : piece)}
              style={[
                styles.trayPiece,
                { borderColor: selected === piece ? game.primary : game.surface, shadowColor: game.shadow },
              ]}
            >
              <PuzzlePiece scene={scene} size={traySize} cols={question.cols} rows={question.rows} index={piece} />
            </Draggable>
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  board: { borderWidth: 3, borderRadius: borderRadius.md, overflow: 'hidden' },
  hintLayer: { position: 'absolute', left: 0, top: 0, opacity: 0.28 },
  cell: { position: 'absolute', borderWidth: 0.5 },
  tray: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  trayPiece: {
    borderWidth: 3,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
});
