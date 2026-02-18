import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFasting } from '@/hooks/use-fasting';
import { useRewardsStore } from '@/store/rewards-store';
import { useChildrenStore } from '@/store/children-store';
import { FastingDayCard } from '@/components/fasting-day-card';
import { RewardSummary } from '@/components/reward-summary';
import { FastingStatus } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface ChildDetailScreenProps {
  childId: string;
  onGoBack: () => void;
}

export const ChildDetailScreen: React.FC<ChildDetailScreenProps> = ({
  childId,
  onGoBack,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { children } = useChildrenStore();
  const { rewards } = useRewardsStore();
  const {
    isLoading,
    fetchFastingLogs,
    updateFastingStatus,
    getStatusForDate,
    calculateStats,
    ramadanDates,
  } = useFasting(childId);

  const child = children.find((c) => c.id === childId);
  const stats = calculateStats();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFastingLogs();
  }, [fetchFastingLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFastingLogs();
    setRefreshing(false);
  }, [fetchFastingLogs]);

  const handleStatusChange = async (date: string, status: FastingStatus) => {
    await updateFastingStatus(date, status);
  };

  const renderHeader = () => (
    <View>
      <RewardSummary
        stats={stats}
        fullDayAmount={rewards?.full_day_amount ?? 5}
        halfDayAmount={rewards?.half_day_amount ?? 2.5}
      />
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          30 Days of Ramadan
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <FastingDayCard
      day={index + 1}
      date={item}
      status={getStatusForDate(item)}
      onStatusChange={(status) => handleStatusChange(item, status)}
      isLoading={isLoading}
    />
  );

  if (!child) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={isDark
            ? ['#0A1F13', '#0F2D1B', '#0A1F13']
            : ['#ECFDF5', '#D1FAE5', '#ECFDF5']
          }
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={onGoBack}
            style={[styles.backButton, { backgroundColor: colors.primaryMuted }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Child not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark
          ? ['#0A1F13', '#0F2D1B', '#0A1F13']
          : ['#ECFDF5', '#D1FAE5', '#ECFDF5']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.headerContent, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity
            onPress={onGoBack}
            style={[styles.backButton, { backgroundColor: colors.primaryMuted }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View
              style={[
                styles.headerAvatar,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {child.name}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      {isLoading && ramadanDates.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={ramadanDates}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headline,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.title3,
  },
});
