import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useSubscription } from '@/hooks/use-subscription';
import { borderRadius, spacing, typography } from '@/constants/theme';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  onUpgrade?: () => void;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  feature = 'This feature',
  onUpgrade,
}) => {
  const { isPremium } = useSubscription();
  const { colors } = useTheme();
  const router = useRouter();

  if (isPremium) return <>{children}</>;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/premium/upgrade');
    }
  };

  return (
    <View style={[styles.gate, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <View style={[styles.lockCircle, { backgroundColor: colors.rewardMuted }]}>
        <Ionicons name="lock-closed" size={28} color={colors.rewardColor} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Premium Feature</Text>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>
        {feature} is available with MyLittleMuslim Premium.
      </Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.rewardColor }]}
        onPress={handleUpgrade}
        activeOpacity={0.8}
      >
        <Ionicons name="star" size={16} color="#FFFFFF" />
        <Text style={styles.btnText}>Upgrade to Premium</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  gate: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
    margin: spacing.xl,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title3,
    textAlign: 'center',
  },
  desc: {
    ...typography.subhead,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  btnText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
});
