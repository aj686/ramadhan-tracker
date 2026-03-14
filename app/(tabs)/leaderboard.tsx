import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { useSubscription } from '@/hooks/use-subscription';
import { PremiumGate } from '@/components/premium-gate';
import { supabase } from '@/services/supabase';
import { useFastingStore } from '@/store/fasting-store';
import { usePrayerStore } from '@/store/prayer-store';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { FastingLog, PrayerLog } from '@/types';

// Score: full=10, half=5, each prayer=2 (max/day = 20)
function computeScore(fasting: FastingLog[], prayer: PrayerLog[]): number {
  const fastScore = fasting.reduce((s, l) => {
    if (l.status === 'full') return s + 10;
    if (l.status === 'half') return s + 5;
    return s;
  }, 0);
  const prayerScore = prayer.reduce((s, l) => {
    return s + [l.fajr, l.dhuhr, l.asr, l.maghrib, l.isha].filter(Boolean).length * 2;
  }, 0);
  return fastScore + prayerScore;
}

const MEDAL_COLORS = ['#F59E0B', '#94A3B8', '#B45309'];
const MEDAL_ICONS  = ['🥇', '🥈', '🥉'];
const AVATAR_COLORS = [
  { bg: 'rgba(34,197,94,0.15)',  fg: '#22C55E' },
  { bg: 'rgba(168,85,247,0.15)', fg: '#A855F7' },
  { bg: 'rgba(249,115,22,0.15)', fg: '#F97316' },
  { bg: 'rgba(59,130,246,0.15)', fg: '#3B82F6' },
];

export default function LeaderboardScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { children } = useChildren();
  const { isPremium } = useSubscription();
  const { logs: fastingLogs, setLogs: setFastingLogs } = useFastingStore();
  const { logs: prayerLogs, setLogs: setPrayerLogs } = usePrayerStore();
  const [loading, setLoading] = React.useState(false);

  // Fetch all children's data
  useEffect(() => {
    if (!isPremium || children.length === 0) return;
    setLoading(true);
    const fetchAll = async () => {
      try {
        await Promise.all(
          children.map(async (child) => {
            const [{ data: fl }, { data: pl }] = await Promise.all([
              supabase.from('fasting_log').select('*').eq('child_id', child.id),
              supabase.from('prayer_log').select('*').eq('child_id', child.id),
            ]);
            if (fl) setFastingLogs(child.id, fl as FastingLog[]);
            if (pl) setPrayerLogs(child.id, pl as PrayerLog[]);
          }),
        );
      } catch {
        Alert.alert('Error', 'Could not load leaderboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isPremium, children.length]);

  const ranked = useMemo(() => {
    return children
      .map((child, idx) => ({
        child,
        idx,
        score: computeScore(fastingLogs[child.id] || [], prayerLogs[child.id] || []),
        fastDays: (fastingLogs[child.id] || []).filter((l) => l.status === 'full' || l.status === 'half').length,
        prayers: (prayerLogs[child.id] || []).reduce(
          (s, l) => s + [l.fajr, l.dhuhr, l.asr, l.maghrib, l.isha].filter(Boolean).length, 0,
        ),
      }))
      .sort((a, b) => b.score - a.score);
  }, [children, fastingLogs, prayerLogs]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A','#1E293B','#0F172A'] : ['#FFFFFF','#FFFFFF','#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Leaderboard</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Ramadan 2026</Text>
      </View>

      <PremiumGate feature="Family Leaderboard">
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.rewardColor} />
          </View>
        ) : children.length < 2 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Add more children</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Leaderboard needs at least 2 child profiles to compare.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Podium — top 3 */}
            {ranked.length >= 2 && (
              <View style={styles.podiumSection}>
                <View style={styles.podium}>
                  {/* 2nd place — left */}
                  {ranked[1] && (
                    <View style={[styles.podiumItem, styles.podiumSecond]}>
                      <Text style={styles.podiumMedal}>{MEDAL_ICONS[1]}</Text>
                      <View style={[styles.podiumAvatar, { backgroundColor: AVATAR_COLORS[ranked[1].idx % 4].bg }]}>
                        <Ionicons name="person" size={22} color={AVATAR_COLORS[ranked[1].idx % 4].fg} />
                      </View>
                      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                        {ranked[1].child.name}
                      </Text>
                      <View style={[styles.podiumBar, styles.podiumBar2nd, { backgroundColor: MEDAL_COLORS[1] }]}>
                        <Text style={styles.podiumScore}>{ranked[1].score}</Text>
                      </View>
                    </View>
                  )}

                  {/* 1st place — center */}
                  {ranked[0] && (
                    <View style={[styles.podiumItem, styles.podiumFirst]}>
                      <Text style={styles.podiumMedal}>{MEDAL_ICONS[0]}</Text>
                      <View style={[styles.podiumAvatarLg, { backgroundColor: AVATAR_COLORS[ranked[0].idx % 4].bg }]}>
                        <Ionicons name="person" size={28} color={AVATAR_COLORS[ranked[0].idx % 4].fg} />
                      </View>
                      <Text style={[styles.podiumName, styles.podiumNameLg, { color: colors.text }]} numberOfLines={1}>
                        {ranked[0].child.name}
                      </Text>
                      <View style={[styles.podiumBar, styles.podiumBar1st, { backgroundColor: MEDAL_COLORS[0] }]}>
                        <Text style={styles.podiumScore}>{ranked[0].score}</Text>
                      </View>
                    </View>
                  )}

                  {/* 3rd place — right */}
                  {ranked[2] && (
                    <View style={[styles.podiumItem, styles.podiumThird]}>
                      <Text style={styles.podiumMedal}>{MEDAL_ICONS[2]}</Text>
                      <View style={[styles.podiumAvatar, { backgroundColor: AVATAR_COLORS[ranked[2].idx % 4].bg }]}>
                        <Ionicons name="person" size={22} color={AVATAR_COLORS[ranked[2].idx % 4].fg} />
                      </View>
                      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
                        {ranked[2].child.name}
                      </Text>
                      <View style={[styles.podiumBar, styles.podiumBar3rd, { backgroundColor: MEDAL_COLORS[2] }]}>
                        <Text style={styles.podiumScore}>{ranked[2].score}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Full ranked list */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Full Ranking</Text>
            {ranked.map((entry, rank) => (
              <View
                key={entry.child.id}
                style={[styles.rankRow, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}
              >
                <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
                  <View style={[styles.rankContent, { backgroundColor: colors.glass }]}>
                    <Text style={[styles.rankNum, { color: rank < 3 ? MEDAL_COLORS[rank] : colors.textMuted }]}>
                      {rank < 3 ? MEDAL_ICONS[rank] : `#${rank + 1}`}
                    </Text>
                    <View style={[styles.rankAvatar, { backgroundColor: AVATAR_COLORS[entry.idx % 4].bg }]}>
                      <Ionicons name="person" size={20} color={AVATAR_COLORS[entry.idx % 4].fg} />
                    </View>
                    <Text style={[styles.rankName, { color: colors.text }]}>{entry.child.name}</Text>
                    <View style={styles.rankStats}>
                      <View style={styles.rankStat}>
                        <Ionicons name="sunny" size={12} color={colors.fastingColor} />
                        <Text style={[styles.rankStatText, { color: colors.textSecondary }]}>
                          {entry.fastDays}
                        </Text>
                      </View>
                      <View style={styles.rankStat}>
                        <Ionicons name="moon" size={12} color={colors.prayerColor} />
                        <Text style={[styles.rankStatText, { color: colors.textSecondary }]}>
                          {entry.prayers}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.scoreBadge, { backgroundColor: colors.rewardMuted }]}>
                      <Text style={[styles.scoreText, { color: colors.rewardColor }]}>{entry.score}pts</Text>
                    </View>
                  </View>
                </BlurView>
              </View>
            ))}

            {/* Score guide */}
            <View style={[styles.guide, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.guideTitle, { color: colors.textSecondary }]}>How scores are calculated</Text>
              <Text style={[styles.guideText, { color: colors.textMuted }]}>
                Full fast = 10pts · Half fast = 5pts · Each prayer = 2pts
              </Text>
            </View>
          </ScrollView>
        )}
      </PremiumGate>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal:spacing.xl, paddingBottom:spacing.md },
  headerTitle: { ...typography.title2 },
  headerSub: { ...typography.caption, marginTop:2 },
  loadingBox: { flex:1, justifyContent:'center', alignItems:'center' },
  emptyBox: { flex:1, justifyContent:'center', alignItems:'center', padding:spacing.xl, gap:spacing.md },
  emptyEmoji: { fontSize:56 },
  emptyTitle: { ...typography.title3, textAlign:'center' },
  emptySub: { ...typography.subhead, textAlign:'center' },
  scroll: { paddingHorizontal:spacing.xl, paddingTop:spacing.sm },
  podiumSection: { marginBottom:spacing.xl },
  podium: { flexDirection:'row', alignItems:'flex-end', justifyContent:'center', gap:spacing.md },
  podiumItem: { alignItems:'center', flex:1 },
  podiumFirst: {},
  podiumSecond: {},
  podiumThird: {},
  podiumMedal: { fontSize:24, marginBottom:spacing.xs },
  podiumAvatar: {
    width:48, height:48, borderRadius:borderRadius.full,
    justifyContent:'center', alignItems:'center', marginBottom:spacing.xs,
  },
  podiumAvatarLg: {
    width:60, height:60, borderRadius:borderRadius.full,
    justifyContent:'center', alignItems:'center', marginBottom:spacing.xs,
  },
  podiumName: { ...typography.footnote, fontWeight:'600', textAlign:'center', marginBottom:spacing.xs },
  podiumNameLg: { ...typography.subhead, fontWeight:'700' },
  podiumBar: {
    width:'80%', borderRadius:borderRadius.sm, alignItems:'center', paddingVertical:spacing.sm,
  },
  podiumBar1st: { height:80, justifyContent:'center' },
  podiumBar2nd: { height:60, justifyContent:'center' },
  podiumBar3rd: { height:44, justifyContent:'center' },
  podiumScore: { color:'#FFF', fontWeight:'700', fontSize:13 },
  sectionLabel: { ...typography.headline, marginBottom:spacing.md },
  rankRow: {
    borderRadius:borderRadius.lg, overflow:'hidden', borderWidth:1,
    marginBottom:spacing.sm, shadowOffset:{width:0,height:2}, shadowOpacity:1, shadowRadius:6, elevation:2,
  },
  blur: { overflow:'hidden' },
  rankContent: { flexDirection:'row', alignItems:'center', padding:spacing.md, gap:spacing.md },
  rankNum: { fontSize:20, width:32, textAlign:'center' },
  rankAvatar: { width:40, height:40, borderRadius:borderRadius.full, justifyContent:'center', alignItems:'center' },
  rankName: { ...typography.headline, flex:1 },
  rankStats: { flexDirection:'row', gap:spacing.md },
  rankStat: { flexDirection:'row', alignItems:'center', gap:3 },
  rankStatText: { ...typography.footnote },
  scoreBadge: { paddingHorizontal:spacing.sm, paddingVertical:3, borderRadius:borderRadius.full },
  scoreText: { ...typography.footnote, fontWeight:'700' },
  guide: {
    padding:spacing.md, borderRadius:borderRadius.md, marginTop:spacing.lg, gap:spacing.xs,
  },
  guideTitle: { ...typography.footnote, fontWeight:'600' },
  guideText: { ...typography.caption },
});
