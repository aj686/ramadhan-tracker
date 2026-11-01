import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { spacing, typography } from '@/constants/theme';

interface PillButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'light';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export const PillButton: React.FC<PillButtonProps> = ({ label, onPress, variant = 'primary', icon, style }) => {
  const { game } = useTheme();
  const isPrimary = variant === 'primary';
  const foreground = isPrimary ? game.onPrimary : game.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: isPrimary ? game.primary : game.surface, shadowColor: game.shadow },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={20} color={foreground} />}
        <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    minHeight: 58,
    borderRadius: 29,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  pressed: { transform: [{ scale: 0.97 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.headline, fontWeight: '700', fontSize: 18 },
});
