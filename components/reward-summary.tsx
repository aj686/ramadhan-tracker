import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ChildStats } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface RewardSummaryProps {
  stats: ChildStats;
  fullDayAmount: number;
  halfDayAmount: number;
}

export const RewardSummary: React.FC<RewardSummaryProps> = ({
  stats,
  fullDayAmount,
  halfDayAmount,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.glassBorder,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blur}
      >
        <View style={[styles.content, { backgroundColor: colors.glass }]}>
          <View style={styles.header}>
            <Ionicons name="gift" size={24} color={colors.accent} />
            <Text style={[styles.title, { color: colors.text }]}>
              Reward Summary
            </Text>
          </View>

          <View style={styles.rows}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: `${colors.fastingFull}20` },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.fastingFull}
                  />
                </View>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  Full Days ({stats.fullDays} × RM{fullDayAmount.toFixed(2)})
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                RM {(stats.fullDays * fullDayAmount).toFixed(2)}
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: `${colors.fastingHalf}20` },
                  ]}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={colors.fastingHalf}
                  />
                </View>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                  Half Days ({stats.halfDays} × RM{halfDayAmount.toFixed(2)})
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                RM {(stats.halfDays * halfDayAmount).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <View style={styles.totalLeft}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
              <Text style={[styles.totalLabel, { color: colors.text }]}>
                Total Reward
              </Text>
            </View>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              RM {stats.totalReward.toFixed(2)}
            </Text>
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title3,
  },
  rows: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    ...typography.subhead,
  },
  rowValue: {
    ...typography.subhead,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalLabel: {
    ...typography.headline,
  },
  totalValue: {
    ...typography.title1,
  },
});
