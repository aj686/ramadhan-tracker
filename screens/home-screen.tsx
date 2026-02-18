import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChildren } from '@/hooks/use-children';
import { useRewards } from '@/hooks/use-rewards';
import { useFastingStore } from '@/store/fasting-store';
import { useRewardsStore } from '@/store/rewards-store';
import { ChildCard } from '@/components/child-card';
import { Child, ChildStats } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface HomeScreenProps {
  onNavigateToChild: (childId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToChild }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { children, isLoading, fetchChildren, createChild, editChild, deleteChild, canAddChild } =
    useChildren();
  const { fetchRewards } = useRewards();
  const { rewards } = useRewardsStore();
  const { logs } = useFastingStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childName, setChildName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChildren();
    fetchRewards();
  }, [fetchChildren, fetchRewards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchChildren(), fetchRewards()]);
    setRefreshing(false);
  }, [fetchChildren, fetchRewards]);

  const calculateChildStats = (childId: string): ChildStats => {
    const childLogs = logs[childId] || [];
    const fullDays = childLogs.filter((l) => l.status === 'full').length;
    const halfDays = childLogs.filter((l) => l.status === 'half').length;
    const noneDays = childLogs.filter((l) => l.status === 'none').length;

    const fullAmount = rewards?.full_day_amount ?? 5;
    const halfAmount = rewards?.half_day_amount ?? 2.5;
    const totalReward = fullDays * fullAmount + halfDays * halfAmount;

    return { fullDays, halfDays, noneDays, totalReward };
  };

  const handleAddChild = () => {
    setEditingChild(null);
    setChildName('');
    setModalVisible(true);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setChildName(child.name);
    setModalVisible(true);
  };

  const handleSaveChild = async () => {
    if (!childName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    let result;
    if (editingChild) {
      result = await editChild(editingChild.id, { name: childName.trim() });
    } else {
      result = await createChild({ name: childName.trim() });
    }

    if (result.success) {
      setModalVisible(false);
      setChildName('');
      setEditingChild(null);
    } else {
      Alert.alert('Error', result.error || 'Failed to save');
    }
  };

  const handleDeleteChild = async (childId: string) => {
    Alert.alert(
      'Delete Child',
      'Are you sure? This will delete all fasting records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteChild(childId);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const totalRewards = children.reduce((sum, child) => {
    return sum + calculateChildStats(child.id).totalReward;
  }, 0);

  if (isLoading && children.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <Ionicons name="moon" size={28} color={colors.primary} />
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                Ramadan Mubarak
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              My Children
            </Text>
          </View>
        </View>

        {/* Total Reward Card */}
        <View
          style={[
            styles.totalCard,
            {
              borderColor: colors.glassBorder,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={styles.totalBlur}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.totalGradient}
            >
              <View style={styles.totalContent}>
                <View style={styles.totalLeft}>
                  <View
                    style={[
                      styles.totalIcon,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Ionicons name="wallet" size={24} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                      Total Rewards
                    </Text>
                    <Text style={[styles.totalValue, { color: colors.primary }]}>
                      RM {totalRewards.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="trending-up" size={32} color={colors.primary} />
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Children List */}
        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons name="people" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No children added yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Add your children to start tracking their fasting journey
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={handleAddChild}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              stats={calculateChildStats(child.id)}
              onPress={() => onNavigateToChild(child.id)}
              onEdit={() => handleEditChild(child)}
              onDelete={() => handleDeleteChild(child.id)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {canAddChild && children.length > 0 && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              bottom: insets.bottom + 80,
              shadowColor: colors.primary,
            },
          ]}
          onPress={handleAddChild}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surfaceSolid,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIcon,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Ionicons
                  name={editingChild ? 'pencil' : 'person-add'}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingChild ? 'Edit Child' : 'Add Child'}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.primaryMuted,
                  },
                ]}
                placeholder="Enter child's name"
                placeholderTextColor={colors.textMuted}
                value={childName}
                onChangeText={setChildName}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: colors.primaryMuted },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setChildName('');
                  setEditingChild(null);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSaveChild}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.subhead,
  },
  title: {
    ...typography.largeTitle,
    marginTop: spacing.xs,
  },
  totalCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  totalBlur: {
    overflow: 'hidden',
  },
  totalGradient: {
    padding: spacing.xl,
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  totalIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.subhead,
  },
  totalValue: {
    ...typography.title1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    ...typography.title3,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.subhead,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.title2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  cancelButton: {},
  cancelButtonText: {
    ...typography.headline,
  },
  saveButton: {},
  saveButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
});
