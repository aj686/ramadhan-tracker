import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ShapeKind } from '@/data/games/schema';

interface ShapeViewProps {
  kind: ShapeKind;
  color: string;
  size: number;
}

// Drawn from Views and text glyphs, so shapes need no images or SVG library.
export const ShapeView: React.FC<ShapeViewProps> = ({ kind, color, size }) => {
  const renderShape = () => {
    switch (kind) {
      case 'circle':
        return <View style={{ width: size * 0.9, height: size * 0.9, borderRadius: size, backgroundColor: color }} />;
      case 'square':
        return <View style={{ width: size * 0.8, height: size * 0.8, borderRadius: size * 0.06, backgroundColor: color }} />;
      case 'rectangle':
        return <View style={{ width: size * 0.95, height: size * 0.58, borderRadius: size * 0.05, backgroundColor: color }} />;
      case 'oval':
        return (
          <View
            style={{
              width: size * 0.92,
              height: size * 0.92,
              borderRadius: size,
              backgroundColor: color,
              transform: [{ scaleY: 0.66 }],
            }}
          />
        );
      case 'triangle':
        return (
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: size * 0.48,
              borderRightWidth: size * 0.48,
              borderBottomWidth: size * 0.84,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
            }}
          />
        );
      case 'diamond':
        return (
          <View
            style={{
              width: size * 0.64,
              height: size * 0.64,
              borderRadius: size * 0.04,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
            }}
          />
        );
      case 'star':
        return <Text style={[styles.glyph, { color, fontSize: size, lineHeight: size * 1.1 }]}>{'★︎'}</Text>;
      case 'heart':
        return <Text style={[styles.glyph, { color, fontSize: size * 0.95, lineHeight: size * 1.1 }]}>{'♥︎'}</Text>;
    }
  };

  return <View style={[styles.box, { width: size, height: size }]}>{renderShape()}</View>;
};

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  glyph: { textAlign: 'center', includeFontPadding: false },
});
