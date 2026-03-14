import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  intensity?: number;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  intensity = 60,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const card = (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.glassBorder,
          shadowColor: colors.glassShadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blur}
      >
        <View style={[styles.content, { backgroundColor: colors.glass }, contentStyle]}>
          {children}
        </View>
      </BlurView>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        {card}
      </TouchableOpacity>
    );
  }

  return card;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
});
