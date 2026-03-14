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
import { BlurView } from 'expo-blur';
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
  const [fullAmount, setFullAmount] = useState('');
  const [halfAmount, setHalfAmount] = useState('');
  const [customFull, setCustomFull] = useState('');
  const [customHalf, setCustomHalf] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

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
      if (isNaN(full) || full < 0) { Alert.alert('Error', 'Please enter a valid amount for full day'); return; }
      if (isNaN(half) || half < 0) { Alert.alert('Error', 'Please enter a valid amount for half day'); return; }
      if (half > full) { Alert.alert('Error', 'Half day amount cannot exceed full day amount'); return; }
      setIsSaving(true);
      const result = await updateRewards({ full_day_amount: full, half_day_amount: half, reward_type: 'money' });
      setIsSaving(false);
      if (result?.success) Alert.alert('Saved', 'Reward settings updated');
      else Alert.alert('Error', result?.error || 'Failed to save');
    } else {
      if (!customFull.trim()) { Alert.alert('Error', 'Please describe the full day reward'); return; }
      if (!customHalf.trim()) { Alert.alert('Error', 'Please describe the half day reward'); return; }
      setIsSaving(true);
      const result = await updateRewards({
        full_day_amount: rewards?.full_day_amount ?? defaultFullAmount,
        half_day_amount: rewards?.half_day_amount ?? defaultHalfAmount,
        reward_type: 'custom',
        custom_reward_full: customFull.trim(),
        custom_reward_half: customHalf.trim(),
      });
      setIsSaving(false);
      if (result?.success) Alert.alert('Saved', 'Reward settings updated');
      else Alert.alert('Error', result?.error || 'Failed to save');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            <View style={[styles.headerIcon, { backgroundColor: colors.rewardMuted }]}>
              <Ionicons name="gift" size={28} color={colors.rewardColor} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Reward Settings</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Set how your children earn rewards for fasting
            </Text>
          </View>

          {/* FREE badge notice */}
          <View style={[styles.freeBadgeRow, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.freeBadgeText, { color: colors.primary }]}>
              Custom rewards are included FREE — applies to Puasa & Solat
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxxl }} />
          ) : (
            <View style={styles.form}>
              {/* Reward Type Dropdown */}
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Reward Type</Text>
              <TouchableOpacity
                style={[styles.dropdown, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}
                onPress={() => setShowDropdown(true)}
                activeOpacity={0.7}
              >
                <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.dropdownBlur}>
                  <View style={[styles.dropdownContent, { backgroundColor: colors.glass }]}>
                    <View style={[styles.dropdownIcon, { backgroundColor: colors.rewardMuted }]}>
                      <Ionicons name={selectedOption.icon as any} size={20} color={colors.rewardColor} />
                    </View>
                    <View style={styles.dropdownText}>
                      <Text style={[styles.dropdownLabel, { color: colors.text }]}>{selectedOption.label}</Text>
                      <Text style={[styles.dropdownDesc, { color: colors.textMuted }]}>{selectedOption.desc}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                  </View>
                </BlurView>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              {/* Form fields */}
              {rewardType === 'money' ? (
                <>
                  <RewardRow
                    icon="sunny"
                    iconColor={colors.fastingColor}
                    iconBg={colors.fastingMuted}
                    label="Full Day Fast"
                    desc="Complete fast from dawn to dusk"
                    colors={colors}
                    isDark={isDark}
                  >
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
                  </RewardRow>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  <RewardRow
                    icon="partly-sunny"
                    iconColor={colors.rewardColor}
                    iconBg={colors.rewardMuted}
                    label="Half Day Fast"
                    desc="Partial fasting effort"
                    colors={colors}
                    isDark={isDark}
                  >
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
                  </RewardRow>
                </>
              ) : (
                <>
                  <RewardRow
                    icon="sunny"
                    iconColor={colors.fastingColor}
                    iconBg={colors.fastingMuted}
                    label="Full Day Fast Reward"
                    desc="What does the child get?"
                    colors={colors}
                    isDark={isDark}
                  >
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
                  </RewardRow>

                  <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

                  <RewardRow
                    icon="partly-sunny"
                    iconColor={colors.rewardColor}
                    iconBg={colors.rewardMuted}
                    label="Half Day Fast Reward"
                    desc="What does the child get?"
                    colors={colors}
                    isDark={isDark}
                  >
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
                  </RewardRow>
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
          <View style={[styles.dropdownMenu, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.menuBlur}>
              <View style={{ backgroundColor: colors.surfaceSolid }}>
                {REWARD_TYPE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      index < REWARD_TYPE_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                      rewardType === option.value && { backgroundColor: colors.primaryMuted },
                    ]}
                    onPress={() => { setRewardType(option.value); setShowDropdown(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.optionIcon, {
                      backgroundColor: rewardType === option.value ? colors.primary : colors.primaryMuted,
                    }]}>
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
            </BlurView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Small helper sub-component to avoid repetition in reward rows
function RewardRow({
  icon, iconColor, iconBg, label, desc, children, colors, isDark,
}: {
  icon: any; iconColor: string; iconBg: string;
  label: string; desc: string; children: React.ReactNode;
  colors: any; isDark: boolean;
}) {
  return (
    <View style={rowStyles.wrapper}>
      <View style={[rowStyles.card, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={rowStyles.blur}>
          <View style={[rowStyles.content, { backgroundColor: colors.glass }]}>
            <View style={[rowStyles.icon, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={22} color={iconColor} />
            </View>
            <View style={rowStyles.text}>
              <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
              <Text style={[rowStyles.desc, { color: colors.textSecondary }]}>{desc}</Text>
            </View>
          </View>
        </BlurView>
      </View>
      {children}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  blur: { overflow: 'hidden' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { flex: 1 },
  label: { ...typography.headline },
  desc: { ...typography.footnote, marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.title2, textAlign: 'center' },
  subtitle: { ...typography.subhead, textAlign: 'center' },
  freeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginBottom: spacing.xl,
    alignSelf: 'center',
  },
  freeBadgeText: { ...typography.caption, fontWeight: '600', flexShrink: 1 },
  form: { gap: spacing.md },
  sectionLabel: { ...typography.footnote, marginBottom: -spacing.xs },
  dropdown: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownBlur: { overflow: 'hidden' },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  dropdownIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownText: { flex: 1 },
  dropdownLabel: { ...typography.headline },
  dropdownDesc: { ...typography.caption, marginTop: 2 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  currency: { ...typography.headline },
  input: { flex: 1, ...typography.title3 },
  divider: { height: 1, marginVertical: spacing.sm },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { ...typography.headline, color: '#FFFFFF' },
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
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  menuBlur: { overflow: 'hidden' },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
