import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { spacing, typography } from '@/constants/theme';

interface SegmentedProgressProps {
  done: number;
  total: number;
}

export const SegmentedProgress: React.FC<SegmentedProgressProps> = ({ done, total }) => {
  const { game } = useTheme();

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <Text style={[styles.count, { color: game.text }]}>{done}/{total}</Text>
      <View style={styles.track}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, { backgroundColor: i < done ? game.primary : game.primaryMuted }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.xs },
  count: { ...typography.footnote, fontWeight: '700' },
  track: { flexDirection: 'row', gap: 4, width: '100%', maxWidth: 200 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
