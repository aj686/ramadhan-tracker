import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { useThemeStore, ThemePreference } from '@/store/theme-store';
import { borderRadius, spacing, typography } from '@/constants/theme';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isPremium, plan, expiresAt } = useSubscription();
  const { preference, setPreference } = useThemeStore();

  const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: 'sunny' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'phone-portrait' },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleUpgrade = () => {
    router.push('/premium/upgrade');
  };

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

        {/* Avatar + email card */}
        <View style={[styles.card, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}>
                <Text style={styles.avatarEmoji}>🌙</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userEmail, { color: colors.text }]} numberOfLines={1}>
                  {user?.email}
                </Text>
                <View style={[styles.planBadge, {
                  backgroundColor: isPremium ? colors.rewardMuted : colors.primaryMuted,
                }]}>
                  <Ionicons
                    name={isPremium ? 'star' : 'checkmark-circle'}
                    size={12}
                    color={isPremium ? colors.rewardColor : colors.primary}
                  />
                  <Text style={[styles.planText, {
                    color: isPremium ? colors.rewardColor : colors.primary,
                  }]}>
                    {isPremium
                      ? `Premium (${plan})${expiryLabel ? ` · expires ${expiryLabel}` : ''}`
                      : 'Free Plan'}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Upgrade CTA — only for free users */}
        {!isPremium && (
          <TouchableOpacity
            style={[styles.upgradeCard, { shadowColor: colors.glassShadow }]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F97316', '#FB923C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <View style={styles.upgradeLeft}>
                <Ionicons name="star" size={24} color="#FFFFFF" />
                <View>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeDesc}>
                    Unlock Quran, Doa, Sunat & more
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Free plan features reminder */}
        {!isPremium && (
          <View style={[styles.sectionCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
              <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Free Plan Includes</Text>
                {[
                  { icon: 'sunny', color: colors.fastingColor, text: 'Puasa Ramadhan tracker' },
                  { icon: 'moon', color: colors.prayerColor, text: 'Solat 5 waktu tracker' },
                  { icon: 'gift', color: colors.rewardColor, text: 'Reward system (money & custom)' },
                  { icon: 'people', color: colors.primary, text: 'Up to 2 child profiles' },
                ].map((item, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: `${item.color}20` }]}>
                      <Ionicons name={item.icon as any} size={16} color={item.color} />
                    </View>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </BlurView>
          </View>
        )}

        {/* Theme toggle */}
        <View style={[styles.sectionCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
              <View style={styles.themeRow}>
                {THEME_OPTIONS.map((opt) => {
                  const isActive = preference === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.themeBtn,
                        {
                          backgroundColor: isActive ? colors.primary : colors.primaryMuted,
                          borderColor: isActive ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setPreference(opt.value)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={16}
                        color={isActive ? '#FFFFFF' : colors.textSecondary}
                      />
                      <Text style={[
                        styles.themeBtnText,
                        { color: isActive ? '#FFFFFF' : colors.textSecondary },
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </BlurView>
        </View>

        {/* Account */}
        <View style={[styles.sectionCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View style={[styles.cardContent, { backgroundColor: colors.glass, paddingVertical: spacing.sm }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

              <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.error} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.error }]}>Logout</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textMuted }]}>
          MyLittleMuslim v{APP_VERSION}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
  },
  pageTitle: {
    ...typography.title2,
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  blur: { overflow: 'hidden' },
  cardContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 26 },
  userInfo: { flex: 1, gap: spacing.xs },
  userEmail: { ...typography.headline },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  planText: { ...typography.caption, fontWeight: '600' },
  upgradeCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  upgradeTitle: { ...typography.headline, color: '#FFFFFF' },
  upgradeDesc: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  sectionTitle: { ...typography.headline, marginBottom: spacing.sm },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { ...typography.subhead },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { ...typography.body, flex: 1 },
  version: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  themeBtnText: {
    ...typography.footnote,
    fontWeight: '600',
  },
});
