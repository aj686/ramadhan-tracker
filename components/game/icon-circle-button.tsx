import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

interface IconCircleButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  text?: string;
  label: string;
  onPress: () => void;
  size?: number;
}

export const IconCircleButton: React.FC<IconCircleButtonProps> = ({ icon, text, label, onPress, size = 46 }) => {
  const { game } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: game.surface,
          shadowColor: game.shadow,
        },
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={size * 0.46} color={game.primary} />
      ) : (
        <Text style={[styles.text, { color: game.primary }]}>{text}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: { transform: [{ scale: 0.94 }] },
  text: { fontSize: 14, fontWeight: '800' },
});
