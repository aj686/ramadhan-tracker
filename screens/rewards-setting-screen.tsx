import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRewards } from '@/hooks/use-rewards';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

export const RewardsSettingScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { rewards, isLoading, fetchRewards, updateRewards, defaultFullAmount, defaultHalfAmount } =
    useRewards();
  const { logout, user } = useAuth();

  const [fullAmount, setFullAmount] = useState('');
  const [halfAmount, setHalfAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    if (rewards) {
      setFullAmount(rewards.full_day_amount.toString());
      setHalfAmount(rewards.half_day_amount.toString());
    } else {
      setFullAmount(defaultFullAmount.toString());
      setHalfAmount(defaultHalfAmount.toString());
    }
  }, [rewards, defaultFullAmount, defaultHalfAmount]);

  const handleSave = async () => {
    const fullNum = parseFloat(fullAmount);
    const halfNum = parseFloat(halfAmount);

    if (isNaN(fullNum) || fullNum < 0) {
      Alert.alert('Error', 'Please enter a valid amount for full day');
      return;
    }

    if (isNaN(halfNum) || halfNum < 0) {
      Alert.alert('Error', 'Please enter a valid amount for half day');
      return;
    }

    setIsSaving(true);
    const result = await updateRewards({
      full_day_amount: fullNum,
      half_day_amount: halfNum,
    });
    setIsSaving(false);

    if (result.success) {
      Alert.alert('Success', 'Rewards updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to update rewards');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading && !rewards) {
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

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="settings" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Settings
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Customize reward amounts
            </Text>
          </View>

          {/* Rewards Card */}
          <View
            style={[
              styles.card,
              {
                borderColor: colors.glassBorder,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={styles.cardBlur}
            >
              <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="gift" size={24} color={colors.accent} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Reward Amounts
                  </Text>
                </View>

                {/* Full Day Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <View
                      style={[
                        styles.inputIcon,
                        { backgroundColor: `${colors.fastingFull}20` },
                      ]}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={colors.fastingFull} />
                    </View>
                    <View>
                      <Text style={[styles.inputTitle, { color: colors.text }]}>
                        Full Day Fasting
                      </Text>
                      <Text style={[styles.inputDescription, { color: colors.textSecondary }]}>
                        Reward for completing a full day
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text style={[styles.currency, { color: colors.primary }]}>RM</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={fullAmount}
                      onChangeText={setFullAmount}
                      keyboardType="decimal-pad"
                      placeholder="5.00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Half Day Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabel}>
                    <View
                      style={[
                        styles.inputIcon,
                        { backgroundColor: `${colors.fastingHalf}20` },
                      ]}
                    >
                      <Ionicons name="time" size={18} color={colors.fastingHalf} />
                    </View>
                    <View>
                      <Text style={[styles.inputTitle, { color: colors.text }]}>
                        Half Day Fasting
                      </Text>
                      <Text style={[styles.inputDescription, { color: colors.textSecondary }]}>
                        Reward for completing half a day
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Text style={[styles.currency, { color: colors.primary }]}>RM</Text>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={halfAmount}
                      onChangeText={setHalfAmount}
                      keyboardType="decimal-pad"
                      placeholder="2.50"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary },
              isSaving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Account Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Account
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                borderColor: colors.glassBorder,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={styles.cardBlur}
            >
              <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
                <View style={styles.accountRow}>
                  <View style={styles.accountInfo}>
                    <View
                      style={[
                        styles.accountIcon,
                        { backgroundColor: colors.primaryMuted },
                      ]}
                    >
                      <Ionicons name="mail" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
                        Email
                      </Text>
                      <Text style={[styles.accountValue, { color: colors.text }]}>
                        {user?.email || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: colors.error,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerIcon: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
  },
  subtitle: {
    ...typography.subhead,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardBlur: {
    overflow: 'hidden',
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cardTitle: {
    ...typography.title3,
  },
  inputGroup: {
    gap: spacing.md,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inputIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputTitle: {
    ...typography.headline,
  },
  inputDescription: {
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
    ...typography.title3,
  },
  input: {
    flex: 1,
    ...typography.title3,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xl,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xxxl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountLabel: {
    ...typography.footnote,
  },
  accountValue: {
    ...typography.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  logoutButtonText: {
    ...typography.headline,
  },
});
