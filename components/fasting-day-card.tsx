import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { FastingStatus } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface FastingDayCardProps {
  day: number;
  date: string;
  status: FastingStatus | null;
  onStatusChange: (status: FastingStatus) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  full: {
    icon: 'checkmark-circle' as const,
    label: 'Full',
  },
  half: {
    icon: 'time' as const,
    label: 'Half',
  },
  none: {
    icon: 'close-circle' as const,
    label: 'None',
  },
};

export const FastingDayCard: React.FC<FastingDayCardProps> = ({
  day,
  date,
  status,
  onStatusChange,
  isLoading = false,
}) => {
  const { colors, isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (s: FastingStatus) => {
    switch (s) {
      case 'full':
        return colors.fastingFull;
      case 'half':
        return colors.fastingHalf;
      case 'none':
        return colors.fastingNone;
    }
  };

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
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blur}
      >
        <View style={[styles.content, { backgroundColor: colors.glass }]}>
          <View style={styles.header}>
            <View style={styles.dayInfo}>
              <View
                style={[
                  styles.dayBadge,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Ionicons name="moon" size={14} color={colors.primary} />
                <Text style={[styles.dayText, { color: colors.primary }]}>
                  Day {day}
                </Text>
              </View>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formatDate(date)}
              </Text>
            </View>
            {status && (
              <View
                style={[
                  styles.currentStatus,
                  { backgroundColor: `${getStatusColor(status)}20` },
                ]}
              >
                <Ionicons
                  name={STATUS_CONFIG[status].icon}
                  size={16}
                  color={getStatusColor(status)}
                />
              </View>
            )}
          </View>

          <View style={styles.statusButtons}>
            {(['full', 'half', 'none'] as FastingStatus[]).map((s) => {
              const isSelected = status === s;
              const statusColor = getStatusColor(s);

              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: isSelected
                        ? statusColor
                        : colors.primaryMuted,
                      borderColor: isSelected
                        ? statusColor
                        : 'transparent',
                    },
                  ]}
                  onPress={() => onStatusChange(s)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={STATUS_CONFIG[s].icon}
                    size={18}
                    color={isSelected ? '#FFFFFF' : statusColor}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                      },
                    ]}
                  >
                    {STATUS_CONFIG[s].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  dayText: {
    ...typography.subhead,
    fontWeight: '600',
  },
  dateText: {
    ...typography.subhead,
  },
  currentStatus: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    ...typography.subhead,
    fontWeight: '500',
  },
});
