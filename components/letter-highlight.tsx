import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { spacing, typography } from '@/constants/theme';

interface LetterHighlightProps {
  word: string;
  activeIndex: number;
}

function AnimatedLetter({ letter, isActive }: { letter: string; isActive: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isActive ? 1.3 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  return (
    <Animated.View style={[styles.letterBox, { transform: [{ scale }] }]}>
      <Text
        style={[
          styles.letter,
          { color: isActive ? '#22C55E' : '#94A3B8' },
        ]}
      >
        {letter}
      </Text>
    </Animated.View>
  );
}

export const LetterHighlight: React.FC<LetterHighlightProps> = ({ word, activeIndex }) => {
  const letters = word.toUpperCase().split('');

  return (
    <View style={styles.container}>
      {letters.map((letter, index) => (
        <AnimatedLetter
          key={`${index}-${letter}`}
          letter={letter}
          isActive={index === activeIndex}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  letterBox: {
    minWidth: 28,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    ...typography.title2,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
