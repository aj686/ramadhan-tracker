import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useSubscription } from '@/hooks/use-subscription';
import { borderRadius, spacing, typography } from '@/constants/theme';
import type { LearningModule } from '@/types';

const MODULES: LearningModule[] = [
  { id: 'animals',     title: 'Animals',             emoji: '🐾', color: '#22C55E', colorMuted: 'rgba(34,197,94,0.12)',   isPremium: false, itemCount: 30 },
  { id: 'allah_names', title: '99 Names of Allah',   emoji: '📿', color: '#8B5CF6', colorMuted: 'rgba(139,92,246,0.12)',  isPremium: false, itemCount: 99 },
  { id: 'prophets',    title: 'Prophets & Rasul',    emoji: '👳', color: '#F59E0B', colorMuted: 'rgba(245,158,11,0.12)',  isPremium: false, itemCount: 25 },
  { id: 'transport',   title: 'Transport',           emoji: '🚗', color: '#06B6D4', colorMuted: 'rgba(6,182,212,0.12)',   isPremium: true,  itemCount: 25 },
  { id: 'countries',   title: 'Countries',           emoji: '🌍', color: '#3B82F6', colorMuted: 'rgba(59,130,246,0.12)',  isPremium: true,  itemCount: 30 },
];

export default function LearnScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = useSubscription();

  const handleModuleTap = (mod: LearningModule) => {
    if (mod.isPremium && !isPremium) {
      router.push('/premium/upgrade');
      return;
    }
    router.push(`/learn/${mod.id}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Learn</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Tap a module to start learning
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: colors.primaryMuted }]}>
          <Text style={styles.headerEmoji}>📚</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* FREE section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FREE</Text>
        {MODULES.filter(m => !m.isPremium).map(renderModuleCard)}

        {/* PREMIUM section */}
        <Text style={[styles.sectionLabel, { color: colors.rewardColor, marginTop: spacing.lg }]}>
          PREMIUM
        </Text>
        {MODULES.filter(m => m.isPremium).map(renderModuleCard)}
      </ScrollView>
    </View>
  );

  function renderModuleCard(mod: LearningModule) {
    const locked = mod.isPremium && !isPremium;

    return (
      <TouchableOpacity
        key={mod.id}
        onPress={() => handleModuleTap(mod)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        <View style={[styles.card, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
              <View style={[styles.iconCircle, { backgroundColor: mod.colorMuted }]}>
                <Text style={styles.iconEmoji}>{mod.emoji}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{mod.title}</Text>
                <Text style={[styles.cardCount, { color: colors.textSecondary }]}>
                  {mod.itemCount} items
                </Text>
              </View>
              {locked ? (
                <View style={[styles.lockBadge, { backgroundColor: colors.rewardMuted }]}>
                  <Ionicons name="lock-closed" size={14} color={colors.rewardColor} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              )}
            </View>
          </BlurView>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: { ...typography.title2 },
  headerSub: { ...typography.footnote, marginTop: 2 },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 22 },
  grid: {
    paddingHorizontal: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  blur: { overflow: 'hidden' },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { ...typography.headline },
  cardCount: { ...typography.caption, marginTop: 2 },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
