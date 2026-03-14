import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color: string;
  trackColor: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  trackColor,
  height = 6,
  style,
}) => {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={[
        styles.track,
        { backgroundColor: trackColor, height, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${clamped * 100}%`,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {},
});
