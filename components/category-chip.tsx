import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius } from '@/constants/theme';

interface CategoryChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  muted: string;
  size?: number;
  style?: ViewStyle;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  icon,
  color,
  muted,
  size = 22,
  style,
}) => {
  const chipSize = size + 18;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: muted,
          width: chipSize,
          height: chipSize,
          borderRadius: borderRadius.md,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
