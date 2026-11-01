import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GameItem, Lang } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { ItemVisual } from './item-visual';
import { NATIVE_DRIVER } from './types';

export type AnswerState = 'idle' | 'selected' | 'correct' | 'wrong' | 'hinted' | 'done';

interface AnswerCardProps {
  item: GameItem;
  language: Lang;
  state: AnswerState;
  width: number;
  minHeight?: number;
  visualSize: number;
  tintIndex: number;
  showLabel: boolean;
  silhouette?: boolean;
  onPress: () => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  item,
  language,
  state,
  width,
  minHeight,
  visualSize,
  tintIndex,
  showLabel,
  silhouette = false,
  onPress,
}) => {
  const { game } = useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  const [shake] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state === 'correct') {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.1, useNativeDriver: NATIVE_DRIVER, speed: 40 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: NATIVE_DRIVER, speed: 20 }),
      ]).start();
    } else if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: NATIVE_DRIVER }),
      ]).start();
    } else if (state === 'hinted') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.05, duration: 450, useNativeDriver: NATIVE_DRIVER }),
          Animated.timing(scale, { toValue: 1, duration: 450, useNativeDriver: NATIVE_DRIVER }),
        ]),
        { iterations: 4 },
      ).start();
    }
  }, [state, scale, shake]);

  const borderColor =
    state === 'correct' ? game.correct
    : state === 'wrong' ? game.gentle
    : state === 'selected' || state === 'hinted' ? game.primary
    : 'transparent';

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] });

  return (
    <Animated.View style={{ width, transform: [{ scale }, { translateX }], opacity: state === 'wrong' || state === 'done' ? 0.55 : 1 }}>
      <Pressable
        onPress={onPress}
        disabled={state === 'done'}
        accessibilityRole="button"
        accessibilityLabel={item.label[language]}
        accessibilityState={{ selected: state === 'selected', disabled: state === 'done' }}
        style={[
          styles.card,
          { backgroundColor: game.answers[tintIndex % game.answers.length], borderColor, shadowColor: game.shadow },
          minHeight !== undefined && { minHeight },
        ]}
      >
        <ItemVisual item={item} size={visualSize} silhouette={silhouette} />
        {showLabel && (
          <Text style={[styles.label, { color: game.text }]} numberOfLines={2}>
            {item.label[language]}
          </Text>
        )}
        {state === 'correct' && (
          <Ionicons name="checkmark-circle" size={26} color={game.correct} style={styles.badge} />
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    borderRadius: borderRadius.xl,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.xs,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  label: { ...typography.subhead, fontWeight: '700', textAlign: 'center' },
  badge: { position: 'absolute', top: 6, right: 6 },
});
