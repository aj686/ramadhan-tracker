import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { useSubscription } from '@/hooks/use-subscription';
import { Alert } from '@/services/alert';
import { COMING_SOON_LABEL, PAYMENT_OPEN, PLANS, type PlanId } from '@/services/toyyibpay';
import { useSubscriptionStore } from '@/store/subscription-store';
import { borderRadius, spacing, typography } from '@/constants/theme';

const FEATURES = [
  { icon: 'water',        color: '#06B6D4', text: 'Puasa Sunat tracker (Isnin/Khamis, Syawal, Arafah)' },
  { icon: 'book',         color: '#3B82F6', text: 'Quran reading tracker (progress to 30 Juz)' },
  { icon: 'heart',        color: '#EC4899', text: 'Doa harian checklist (6 daily doas)' },
  { icon: 'flame',        color: '#F97316', text: 'Prayer streak system' },
  { icon: 'trophy',       color: '#F59E0B', text: 'Family leaderboard' },
  { icon: 'people',       color: '#22C55E', text: 'Unlimited child profiles (free: 2 max)' },
];

export default function UpgradeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack('/(tabs)');
  const { isPremium, isChecking, createPayment, checkSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [isPaying, setIsPaying] = useState(false);

  // If user is already premium, go back
  useEffect(() => {
    if (isPremium) goBack();
  }, [isPremium, goBack]);

  if (isPremium) return null;

  const handleSubscribe = async () => {
    if (isPaying) return;
    setIsPaying(true);
    try {
      const { paymentUrl } = await createPayment(selectedPlan);
      await WebBrowser.openBrowserAsync(paymentUrl);
      await checkSubscription();
    } catch (err) {
      Alert.alert('Could not start the payment', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCheckStatus = async () => {
    await checkSubscription();
    // Read fresh: `isPremium` in this closure is from before the check.
    if (!useSubscriptionStore.getState().isPremium) {
      Alert.alert('Not active yet', 'No active subscription found. If you have paid, please wait a moment and try again.');
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
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Premium</Text>
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
            More features to help your child build great Islamic habits
          </Text>
          {!PAYMENT_OPEN && (
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.rewardMuted }]}>
              <Text style={[styles.comingSoonBadgeText, { color: colors.text }]}>
                {COMING_SOON_LABEL}
              </Text>
            </View>
          )}
        </View>

        {/* Features list */}
        <View style={[styles.featuresCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View style={[styles.featuresContent, { backgroundColor: colors.glass }]}>
              <Text style={[styles.featuresTitle, { color: colors.text }]}>
                {PAYMENT_OPEN ? 'What you get' : "What's coming"}
              </Text>
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

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {PAYMENT_OPEN ? 'Choose a plan' : 'Planned pricing'}
        </Text>
        <View style={styles.plansRow}>
          {Object.values(PLANS).map((plan) => {
            const isSelected = PAYMENT_OPEN && selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                disabled={!PAYMENT_OPEN}
                activeOpacity={0.8}
                onPress={() => setSelectedPlan(plan.id)}
                accessibilityState={{ selected: isSelected, disabled: !PAYMENT_OPEN }}
                style={[
                  styles.planCard,
                  {
                    borderColor: isSelected ? colors.rewardColor : colors.glassBorder,
                    backgroundColor: colors.glass,
                    shadowColor: colors.glassShadow,
                  },
                ]}
              >
                {plan.savings && (
                  <View style={[styles.savingsBadge, { backgroundColor: colors.rewardColor }]}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                <Text style={[styles.planPrice, { color: colors.rewardColor }]}>{plan.price}</Text>
                <Text style={[styles.planPeriod, { color: colors.textMuted }]}>{plan.period}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {PAYMENT_OPEN ? (
          <>
            <TouchableOpacity
              style={[styles.subscribeBtn, { backgroundColor: colors.rewardColor }]}
              onPress={handleSubscribe}
              disabled={isPaying}
              accessibilityRole="button"
            >
              {isPaying ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={[styles.subscribeText, { color: colors.textOnPrimary }]}>Subscribe</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkBtn}
              onPress={handleCheckStatus}
              disabled={isChecking}
              accessibilityRole="button"
            >
              <Text style={[styles.checkText, { color: colors.textSecondary }]}>Check Payment Status</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View
              style={[
                styles.comingSoonBar,
                { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              ]}
            >
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.comingSoonBarText, { color: colors.textSecondary }]}>
                {COMING_SOON_LABEL}
              </Text>
            </View>

            {/* Fine print */}
            <Text style={[styles.finePrint, { color: colors.textSecondary }]}>
              Payment is not open yet. Premium will open here when it is ready.
            </Text>
          </>
        )}
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
  comingSoonBadge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full,
  },
  comingSoonBadgeText: { ...typography.footnote, fontWeight: '700' },
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
  comingSoonBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl, borderWidth: 1,
    marginBottom: spacing.md,
  },
  comingSoonBarText: { ...typography.headline },
  subscribeBtn: {
    minHeight: 54, alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.xl, marginBottom: spacing.sm,
  },
  subscribeText: { ...typography.headline, fontWeight: '700' },
  checkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  checkText: { ...typography.subhead, fontWeight: '600' },
  finePrint: { ...typography.caption, textAlign: 'center', lineHeight: 18 },
});
