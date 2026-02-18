import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Child, ChildStats } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface ChildCardProps {
  child: Child;
  stats: ChildStats;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ChildCard: React.FC<ChildCardProps> = ({
  child,
  stats,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const progressPercentage = Math.round(
    ((stats.fullDays + stats.halfDays + stats.noneDays) / 30) * 100
  );

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.nameRow}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primaryMuted },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.name, { color: colors.text }]}>
                  {child.name}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={onEdit}
                  style={[styles.actionBtn, { backgroundColor: colors.primaryMuted }]}
                >
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDelete}
                  style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View
              style={[
                styles.statsRow,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.fastingFull}
                  />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.fullDays}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Full
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>
                  <Ionicons
                    name="time"
                    size={18}
                    color={colors.fastingHalf}
                  />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.halfDays}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Half
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.fastingNone}
                  />
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.noneDays}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  None
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  Progress
                </Text>
                <Text style={[styles.progressPercent, { color: colors.primary }]}>
                  {progressPercentage}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Reward */}
            <View
              style={[
                styles.rewardContainer,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.rewardRow}>
                <Ionicons name="gift" size={20} color={colors.accent} />
                <Text style={[styles.rewardLabel, { color: colors.textSecondary }]}>
                  Total Reward
                </Text>
              </View>
              <Text style={[styles.rewardValue, { color: colors.primary }]}>
                RM {stats.totalReward.toFixed(2)}
              </Text>
            </View>

            {/* Tap indicator */}
            <View style={styles.tapIndicator}>
              <Text style={[styles.tapText, { color: colors.textMuted }]}>
                Tap to view details
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
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
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    ...typography.title2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    ...typography.title2,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.footnote,
  },
  progressPercent: {
    ...typography.footnote,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  rewardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rewardLabel: {
    ...typography.subhead,
  },
  rewardValue: {
    ...typography.title2,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  tapText: {
    ...typography.caption,
  },
});
