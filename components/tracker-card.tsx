import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { CategoryChip } from './category-chip';
import { ProgressBar } from './progress-bar';

interface TrackerCardProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  muted: string;
  current: number;
  total: number;
  valueLabel?: string; // e.g. "RM 45.00" override
  locked?: boolean;    // true = premium gate
  onPress?: () => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
  label,
  icon,
  color,
  muted,
  current,
  total,
  valueLabel,
  locked = false,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const progress = total > 0 ? current / total : 0;
  const pct = Math.round(progress * 100);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.container,
          { borderColor: colors.glassBorder, shadowColor: colors.glassShadow },
        ]}
      >
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
          <View style={[styles.content, { backgroundColor: colors.glass }]}>
            {/* Left: chip + label */}
            <CategoryChip icon={icon} color={color} muted={muted} size={20} />
            <View style={styles.mid}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              {locked ? (
                <Text style={[styles.lockedText, { color: colors.textMuted }]}>
                  Premium feature
                </Text>
              ) : (
                <>
                  <ProgressBar
                    progress={progress}
                    color={color}
                    trackColor={muted}
                    height={5}
                    style={styles.bar}
                  />
                  <Text style={[styles.sub, { color: colors.textSecondary }]}>
                    {valueLabel ?? `${current} / ${total}`}
                    {'  '}
                    <Text style={{ color, fontWeight: '600' }}>{pct}%</Text>
                  </Text>
                </>
              )}
            </View>
            {/* Right: arrow or lock */}
            {locked ? (
              <View style={[styles.lockBadge, { backgroundColor: colors.border }]}>
                <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </View>
        </BlurView>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  mid: {
    flex: 1,
  },
  label: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  bar: {
    marginBottom: spacing.xs,
  },
  sub: {
    ...typography.caption,
  },
  lockedText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
