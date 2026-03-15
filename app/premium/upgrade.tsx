import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useSubscription } from '@/hooks/use-subscription';
import { PLANS, type PlanId } from '@/services/toyyibpay';
import { borderRadius, spacing, typography } from '@/constants/theme';

const FEATURES = [
  { icon: 'water',        color: '#06B6D4', text: 'Puasa Sunat tracker (Isnin/Khamis, Syawal, Arafah)' },
  { icon: 'book',         color: '#3B82F6', text: 'Quran reading tracker (progress to 30 Juz)' },
  { icon: 'heart',        color: '#EC4899', text: 'Doa harian checklist (6 daily doas)' },
  { icon: 'flame',        color: '#F97316', text: 'Prayer streak system' },
  { icon: 'trophy',       color: '#F59E0B', text: 'Family leaderboard' },
  { icon: 'people',       color: '#22C55E', text: 'Unlimited child profiles (free: 2 max)' },
  { icon: 'ban',          color: '#6B7280', text: 'Remove ads' },
];

export default function UpgradeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { checkSubscription, isPremium, isChecking } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');

  // If user is already premium, go back
  if (isPremium) {
    router.back();
    return null;
  }

  const handleSubscribe = () => {
    Alert.alert(
      'Coming Soon',
      'Premium is currently in development stage. All premium features will be available soon. Stay tuned!',
      [{ text: 'OK' }],
    );
  };

  const handleCheckStatus = async () => {
    await checkSubscription();
    if (isPremium) {
      Alert.alert('Active!', 'Your Premium subscription is now active.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Not Active', 'No active subscription found. If you paid, please wait a moment and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#FFF8F0', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Go Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🌙</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>MyLittleMuslim Premium</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Unlock all features to help your child build great Islamic habits
          </Text>
        </View>

        {/* Features list */}
        <View style={[styles.featuresCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View style={[styles.featuresContent, { backgroundColor: colors.glass }]}>
              <Text style={[styles.featuresTitle, { color: colors.text }]}>What you get</Text>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: `${f.color}20` }]}>
                    <Ionicons name={f.icon as any} size={18} color={f.color} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f.text}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </View>

        {/* Plan selector */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Choose a plan</Text>
        <View style={styles.plansRow}>
          {(Object.values(PLANS) as typeof PLANS[PlanId][]).map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    borderColor: isSelected ? colors.rewardColor : colors.glassBorder,
                    backgroundColor: isSelected ? `${colors.rewardColor}10` : colors.glass,
                    shadowColor: colors.glassShadow,
                  },
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.savings && (
                  <View style={[styles.savingsBadge, { backgroundColor: colors.rewardColor }]}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                <Text style={[styles.planPrice, { color: colors.rewardColor }]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, { color: colors.textMuted }]}>{plan.period}</Text>
                {isSelected && (
                  <View style={[styles.selectedCheck, { backgroundColor: colors.rewardColor }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subscribe button */}
        <TouchableOpacity
          style={[styles.subscribeBtn, isChecking && styles.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          activeOpacity={0.85}
          disabled={isChecking}
        >
          <LinearGradient
            colors={['#F97316', '#FB923C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeBtnGradient}
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.subscribeBtnText}>
              Subscribe {PLANS[selectedPlan].label} — {PLANS[selectedPlan].price}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore / Check status */}
        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleCheckStatus}
          disabled={isChecking}
          activeOpacity={0.7}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.textMuted }]}>
              Already paid? Check payment status
            </Text>
          )}
        </TouchableOpacity>

        {/* Fine print */}
        <Text style={[styles.finePrint, { color: colors.textMuted }]}>
          Payment is processed securely via ToyyibPay (FPX / Credit Card).
          Subscriptions renew automatically unless cancelled.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...typography.title3, flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  heroEmoji: { fontSize: 56 },
  heroTitle: { ...typography.title2, textAlign: 'center' },
  heroSub: { ...typography.subhead, textAlign: 'center', maxWidth: 280 },
  featuresCard: {
    borderRadius: borderRadius.xl, overflow: 'hidden', borderWidth: 1,
    marginBottom: spacing.xl, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 12, elevation: 4,
  },
  blur: { overflow: 'hidden' },
  featuresContent: { padding: spacing.lg, gap: spacing.md },
  featuresTitle: { ...typography.headline, marginBottom: spacing.xs },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 34, height: 34, borderRadius: borderRadius.sm,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  featureText: { ...typography.subhead, flex: 1 },
  sectionLabel: { ...typography.headline, marginBottom: spacing.md },
  plansRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  planCard: {
    flex: 1, borderRadius: borderRadius.xl, borderWidth: 2,
    padding: spacing.md, alignItems: 'center', gap: 4, position: 'relative',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  savingsBadge: {
    position: 'absolute', top: -10, right: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full,
  },
  savingsText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  planLabel: { ...typography.footnote, fontWeight: '600' },
  planPrice: { ...typography.title3, fontWeight: '800' },
  planPeriod: { ...typography.caption },
  selectedCheck: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  subscribeBtn: {
    borderRadius: borderRadius.xl, overflow: 'hidden',
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4,
    shadowColor: 'rgba(249,115,22,0.4)',
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
  },
  subscribeBtnText: { ...typography.headline, color: '#FFFFFF' },
  restoreBtn: { alignItems: 'center', paddingVertical: spacing.md, marginBottom: spacing.md },
  restoreText: { ...typography.subhead, textDecorationLine: 'underline' },
  finePrint: { ...typography.caption, textAlign: 'center', lineHeight: 18 },
});
