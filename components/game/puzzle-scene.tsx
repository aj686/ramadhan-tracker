import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PuzzleScene as Scene } from '@/data/games/schema';

interface PuzzleSceneProps {
  scene: Scene;
  size: number;
}

// The full picture. A puzzle piece is this same picture clipped to one cell.
export const PuzzleScene: React.FC<PuzzleSceneProps> = ({ scene, size }) => (
  <View style={{ width: size, height: size, backgroundColor: scene.sky }}>
    <View
      style={[
        styles.ground,
        { top: (scene.horizon / 100) * size, backgroundColor: scene.ground },
      ]}
    />
    {scene.stickers.map((sticker, i) => {
      const stickerSize = (sticker.size / 100) * size;
      return (
        <Text
          key={i}
          selectable={false}
          style={[
            styles.sticker,
            {
              left: (sticker.x / 100) * size - stickerSize / 2,
              top: (sticker.y / 100) * size - stickerSize / 2,
              width: stickerSize,
              fontSize: stickerSize * 0.82,
              lineHeight: stickerSize,
            },
          ]}
        >
          {sticker.emoji}
        </Text>
      );
    })}
  </View>
);

interface PuzzlePieceProps {
  scene: Scene;
  size: number;
  cols: number;
  rows: number;
  index: number;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ scene, size, cols, rows, index }) => {
  const pieceWidth = size / cols;
  const pieceHeight = size / rows;
  const col = index % cols;
  const row = Math.floor(index / cols);

  return (
    <View style={{ width: pieceWidth, height: pieceHeight, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: -col * pieceWidth, top: -row * pieceHeight }}>
        <PuzzleScene scene={scene} size={size} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sticker: { position: 'absolute', textAlign: 'center', includeFontPadding: false },
});
