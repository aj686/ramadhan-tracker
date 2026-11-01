import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SHAPE_COLORS } from '@/data/games/items';
import type { GameItem } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { IMAGES } from '@/services/game/media';
import { ShapeView } from './shape-view';

interface ItemVisualProps {
  item: GameItem;
  size: number;
  silhouette?: boolean;
}

// One place that decides how an item looks: its illustration when registered,
// otherwise the shape, colour, letter or emoji from its data.
export const ItemVisual: React.FC<ItemVisualProps> = ({ item, size, silhouette = false }) => {
  const { game } = useTheme();
  const image = item.image ? IMAGES[item.image] : undefined;

  if (image) {
    return <Image source={image} style={{ width: size, height: size }} resizeMode="contain" />;
  }

  if (item.shape) {
    return <ShapeView kind={item.shape} color={silhouette ? game.silhouette : SHAPE_COLORS[item.shape]} size={size} />;
  }

  if (item.color) {
    return (
      <View
        style={[
          styles.swatch,
          { width: size * 0.82, height: size * 0.82, borderRadius: size, backgroundColor: item.color, borderColor: game.outline },
        ]}
      />
    );
  }

  if (item.glyph) {
    return (
      <Text style={[styles.text, { color: game.text, fontSize: size * 0.82, lineHeight: size }]}>
        {item.glyph}
      </Text>
    );
  }

  return <Text style={[styles.text, { fontSize: size * 0.74, lineHeight: size }]}>{item.emoji}</Text>;
};

const styles = StyleSheet.create({
  swatch: { borderWidth: 3 },
  text: { fontWeight: '800', textAlign: 'center', includeFontPadding: false },
});
