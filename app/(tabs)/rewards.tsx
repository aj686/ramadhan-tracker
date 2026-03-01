import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useRewards } from '@/hooks/use-rewards';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { RewardType } from '@/types';

const REWARD_TYPE_OPTIONS: { value: RewardType; label: string; icon: string; desc: string }[] = [
  { value: 'money', label: 'Money (RM)', icon: 'cash-outline', desc: 'Set RM amount per fast' },
  { value: 'custom', label: 'Custom Reward', icon: 'gift-outline', desc: 'E.g. toys, trips, treats' },
];

export default function RewardsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { rewards, isLoading, fetchRewards, updateRewards, defaultFullAmount, defaultHalfAmount } = useRewards();

  const [rewardType, setRewardType] = useState<RewardType>('money');
  const [showDropdown, setShowDropdown] = useState(false);

  // Money type state
  const [fullAmount, setFullAmount] = useState('');
  const [halfAmount, setHalfAmount] = useState('');

  // Custom type state
  const [customFull, setCustomFull] = useState('');
  const [customHalf, setCustomHalf] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    if (rewards) {
      setRewardType(rewards.reward_type ?? 'money');
      setFullAmount(String(rewards.full_day_amount));
      setHalfAmount(String(rewards.half_day_amount));
      setCustomFull(rewards.custom_reward_full ?? '');
      setCustomHalf(rewards.custom_reward_half ?? '');
    }
  }, [rewards]);

  const selectedOption = REWARD_TYPE_OPTIONS.find((o) => o.value === rewardType)!;

  const handleSave = async () => {
    if (rewardType === 'money') {
      const full = parseFloat(fullAmount);
      const half = parseFloat(halfAmount);
      if (isNaN(full) || full < 0) {
        Alert.alert('Error', 'Please enter a valid amount for full day');
        return;
      }
      if (isNaN(half) || half < 0) {
        Alert.alert('Error', 'Please enter a valid amount for half day');
        return;
      }
      if (half > full) {
        Alert.alert('Error', 'Half day amount cannot exceed full day amount');
        return;
      }
      setIsSaving(true);
      const result = await updateRewards({
        full_day_amount: full,
        half_day_amount: half,
        reward_type: 'money',
      });
      setIsSaving(false);
      if (result?.success) {
        Alert.alert('Saved', 'Reward settings updated successfully');
      } else {
        Alert.alert('Error', result?.error || 'Failed to save rewards');
      }
    } else {
      if (!customFull.trim()) {
        Alert.alert('Error', 'Please describe the full day reward');
        return;
      }
      if (!customHalf.trim()) {
        Alert.alert('Error', 'Please describe the half day reward');
        return;
      }
      setIsSaving(true);
      const result = await updateRewards({
        full_day_amount: rewards?.full_day_amount ?? defaultFullAmount,
        half_day_amount: rewards?.half_day_amount ?? defaultHalfAmount,
        reward_type: 'custom',
        custom_reward_full: customFull.trim(),
        custom_reward_half: customHalf.trim(),
      });
      setIsSaving(false);
      if (result?.success) {
        Alert.alert('Saved', 'Reward settings updated successfully');
      } else {
        Alert.alert('Error', result?.error || 'Failed to save rewards');
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0A1F13', '#0F2D1B', '#0A1F13']
          : ['#ECFDF5', '#D1FAE5', '#A7F3D0']
        }
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="gift" size={36} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Reward Settings</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose how your children earn rewards for fasting
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
          ) : (
            <View style={styles.form}>
              {/* Reward Type Dropdown */}
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Reward Type</Text>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDropdown(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.dropdownIcon, { backgroundColor: colors.primaryMuted }]}>
                  <Ionicons name={selectedOption.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.dropdownText}>
                  <Text style={[styles.dropdownLabel, { color: colors.text }]}>{selectedOption.label}</Text>
                  <Text style={[styles.dropdownDesc, { color: colors.textMuted }]}>{selectedOption.desc}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              {rewardType === 'money' ? (
                <>
                  {/* Full Day - Money */}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.cardIcon, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="sunny" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardLabel, { color: colors.text }]}>Full Day Fast</Text>
                      <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                        Complete fasting from dawn to dusk
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={[styles.currency, { color: colors.textMuted }]}>RM</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder={String(defaultFullAmount)}
                      placeholderTextColor={colors.textMuted}
                      value={fullAmount}
                      onChangeText={setFullAmount}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  {/* Half Day - Money */}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.cardIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Ionicons name="partly-sunny" size={24} color={colors.accent} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardLabel, { color: colors.text }]}>Half Day Fast</Text>
                      <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                        Partial fasting effort
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={[styles.currency, { color: colors.textMuted }]}>RM</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder={String(defaultHalfAmount)}
                      placeholderTextColor={colors.textMuted}
                      value={halfAmount}
                      onChangeText={setHalfAmount}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Full Day - Custom */}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.cardIcon, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="sunny" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardLabel, { color: colors.text }]}>Full Day Fast Reward</Text>
                      <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                        What does the child get for a full day?
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="gift-outline" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. Buy a new toy"
                      placeholderTextColor={colors.textMuted}
                      value={customFull}
                      onChangeText={setCustomFull}
                      returnKeyType="next"
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  {/* Half Day - Custom */}
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.cardIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                      <Ionicons name="partly-sunny" size={24} color={colors.accent} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardLabel, { color: colors.text }]}>Half Day Fast Reward</Text>
                      <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                        What does the child get for a half day?
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="gift-outline" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="e.g. Ice cream treat"
                      placeholderTextColor={colors.textMuted}
                      value={customHalf}
                      onChangeText={setCustomHalf}
                      returnKeyType="done"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.dropdownMenu, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
            {REWARD_TYPE_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  index < REWARD_TYPE_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                  rewardType === option.value && { backgroundColor: colors.primaryMuted },
                ]}
                onPress={() => {
                  setRewardType(option.value);
                  setShowDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.dropdownIcon, { backgroundColor: rewardType === option.value ? colors.primary : colors.primaryMuted }]}>
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={rewardType === option.value ? '#FFFFFF' : colors.primary}
                  />
                </View>
                <View style={styles.dropdownText}>
                  <Text style={[styles.dropdownLabel, { color: colors.text }]}>{option.label}</Text>
                  <Text style={[styles.dropdownDesc, { color: colors.textMuted }]}>{option.desc}</Text>
                </View>
                {rewardType === option.value && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.title2,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subhead,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.footnote,
    marginBottom: -spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  dropdownIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: {
    flex: 1,
  },
  dropdownLabel: {
    ...typography.headline,
  },
  dropdownDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    ...typography.headline,
  },
  cardDesc: {
    ...typography.footnote,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  currency: {
    ...typography.headline,
  },
  input: {
    flex: 1,
    ...typography.title3,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dropdownMenu: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
});
