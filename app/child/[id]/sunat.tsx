import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useChildren } from '@/hooks/use-children';
import { useSunat, getSunatDates, SUNAT_TYPE_LABELS } from '@/hooks/use-sunat';
import { PremiumGate } from '@/components/premium-gate';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { SunatType } from '@/types';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CURRENT_YEAR = new Date().getFullYear();
const TODAY_STR = (() => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
})();

const TYPE_TABS: { value: SunatType; icon: string }[] = [
  { value: 'isnin_khamis', icon: 'calendar' },
  { value: 'syawal',       icon: 'star'     },
  { value: 'arafah',       icon: 'sunny'    },
];

export default function SunatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { children } = useChildren();
  const { fetchSunatLogs, toggleSunat, isCompleted, calculateStats, isLoading } = useSunat(id);
  const child = children.find((c) => c.id === id);
  const [activeType, setActiveType] = useState<SunatType>('isnin_khamis');

  useEffect(() => { fetchSunatLogs(); }, [fetchSunatLogs]);

  const allDates = useMemo(() => getSunatDates(CURRENT_YEAR), []);
  const stats = calculateStats();

  // Group selected dates by month
  const groupedDates = useMemo(() => {
    const dates = allDates[activeType];
    const groups: { monthKey: string; monthLabel: string; dates: string[] }[] = [];
    dates.forEach((date) => {
      const month = parseInt(date.slice(5, 7), 10) - 1;
      const key = date.slice(0, 7);
      const last = groups[groups.length - 1];
      if (last?.monthKey === key) {
        last.dates.push(date);
      } else {
        groups.push({ monthKey: key, monthLabel: `${MONTH_SHORT[month]} ${CURRENT_YEAR}`, dates: [date] });
      }
    });
    return groups;
  }, [allDates, activeType]);

  const targetForType: Record<SunatType, number> = {
    isnin_khamis: allDates.isnin_khamis.length,
    syawal: 6,
    arafah: 1,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A','#1E293B','#0F172A'] : ['#FFFFFF','#FFFFFF','#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.sunatColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Puasa Sunat</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {child?.name ?? ''} — {CURRENT_YEAR}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <PremiumGate feature="Puasa Sunat tracker">
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.sunatColor} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxxl }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Year summary */}
            <View style={[styles.summaryCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
              <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
                <View style={[styles.summaryContent, { backgroundColor: colors.glass }]}>
                  <View style={[styles.summaryIcon, { backgroundColor: colors.sunatMuted }]}>
                    <Ionicons name="water" size={22} color={colors.sunatColor} />
                  </View>
                  <View style={styles.summaryText}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>Total Puasa Sunat</Text>
                    <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
                      {stats.total} puasa completed
                    </Text>
                  </View>
                  <View style={styles.miniStats}>
                    {(['isnin_khamis','syawal','arafah'] as SunatType[]).map((t) => (
                      <View key={t} style={styles.miniStat}>
                        <Text style={[styles.miniNum, { color: colors.sunatColor }]}>{stats.byType[t]}</Text>
                        <Text style={[styles.miniLabel, { color: colors.textMuted }]}>
                          {t === 'isnin_khamis' ? 'I/K' : t === 'syawal' ? 'Syawl' : 'Arafah'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Type tabs */}
            <View style={styles.typeTabs}>
              {TYPE_TABS.map((tab) => {
                const isActive = tab.value === activeType;
                const done = stats.byType[tab.value];
                const target = targetForType[tab.value];
                return (
                  <TouchableOpacity
                    key={tab.value}
                    style={[
                      styles.typeTab,
                      {
                        backgroundColor: isActive ? colors.sunatColor : colors.backgroundSecondary,
                        borderColor: isActive ? colors.sunatColor : 'transparent',
                      },
                    ]}
                    onPress={() => setActiveType(tab.value)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={tab.icon as any} size={14} color={isActive ? '#FFF' : colors.textMuted} />
                    <Text style={[styles.typeTabLabel, { color: isActive ? '#FFF' : colors.text }]}>
                      {SUNAT_TYPE_LABELS[tab.value]}
                    </Text>
                    <Text style={[styles.typeTabCount, { color: isActive ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                      {done}/{target}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Arafah — single day */}
            {activeType === 'arafah' && (
              <View>
                {allDates.arafah.map((date) => {
                  const done = isCompleted(date, 'arafah');
                  const d = new Date(date);
                  return (
                    <View key={date} style={[styles.arafahCard, {
                      borderColor: done ? colors.sunatColor : colors.glassBorder,
                      shadowColor: colors.glassShadow,
                    }]}>
                      <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
                        <View style={[styles.arafahContent, { backgroundColor: colors.glass }]}>
                          <View style={[styles.arafahIcon, { backgroundColor: colors.sunatMuted }]}>
                            <Ionicons name="sunny" size={28} color={colors.sunatColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.arafahTitle, { color: colors.text }]}>Hari Arafah</Text>
                            <Text style={[styles.arafahDate, { color: colors.textSecondary }]}>
                              {d.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                            </Text>
                            <Text style={[styles.arafahNote, { color: colors.textMuted }]}>
                              9 Dhul Hijjah — erases sins of 2 years
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.doneBtn, { backgroundColor: done ? colors.sunatColor : colors.sunatMuted }]}
                            onPress={() => toggleSunat(date, 'arafah')}
                          >
                            <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={done ? '#FFF' : colors.sunatColor} />
                          </TouchableOpacity>
                        </View>
                      </BlurView>
                    </View>
                  );
                })}
                {allDates.arafah.length === 0 && (
                  <Text style={[styles.emptyNote, { color: colors.textMuted }]}>
                    Arafah date will appear here when available.
                  </Text>
                )}
              </View>
            )}

            {/* Syawal & Isnin/Khamis — date list by month */}
            {activeType !== 'arafah' && groupedDates.map((group) => (
              <View key={group.monthKey}>
                <Text style={[styles.monthLabel, { color: colors.text }]}>{group.monthLabel}</Text>
                {group.dates.map((date) => {
                  const done = isCompleted(date, activeType);
                  const d = new Date(date);
                  const dayNum = d.getDate();
                  const dayName = DAY_SHORT[d.getDay()];
                  const isToday = date === TODAY_STR;
                  const isFuture = date > TODAY_STR;
                  return (
                    <View
                      key={date}
                      style={[
                        styles.dayRow,
                        { borderBottomColor: colors.borderLight },
                        isToday && { backgroundColor: `${colors.sunatColor}08` },
                      ]}
                    >
                      {isToday && <View style={[styles.todayBar, { backgroundColor: colors.sunatColor }]} />}
                      <View style={styles.dateCol}>
                        <Text style={[styles.dayNum, { color: isToday ? colors.sunatColor : isFuture ? colors.textMuted : colors.text }]}>
                          {dayNum}
                        </Text>
                        <Text style={[styles.dayName, { color: isToday ? colors.sunatColor : colors.textMuted }]}>
                          {dayName}
                        </Text>
                      </View>
                      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                      <TouchableOpacity
                        style={[styles.toggleBtn, { backgroundColor: done ? colors.sunatColor : colors.sunatMuted }]}
                        onPress={() => toggleSunat(date, activeType)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={done ? 'checkmark-circle' : 'ellipse-outline'}
                          size={18}
                          color={done ? '#FFF' : colors.sunatColor}
                        />
                        <Text style={[styles.toggleText, { color: done ? '#FFF' : colors.sunatColor }]}>
                          {done ? 'Done' : 'Mark Done'}
                        </Text>
                      </TouchableOpacity>
                      {activeType === 'syawal' && (
                        <Text style={[styles.syawalNote, { color: colors.textMuted }]}>
                          {done ? '✓ counted' : ''}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}

            {activeType === 'syawal' && (
              <View style={[styles.syawalInfo, { backgroundColor: colors.sunatMuted }]}>
                <Ionicons name="information-circle" size={16} color={colors.sunatColor} />
                <Text style={[styles.syawalInfoText, { color: colors.sunatColor }]}>
                  Mark any 6 days from Syawal to complete your 6 Syawal fasts.
                  {' '}Completed: {stats.byType.syawal}/6
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </PremiumGate>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.lg, paddingBottom:spacing.md },
  backBtn: { width:40, height:40, justifyContent:'center', alignItems:'flex-start' },
  headerCenter: { flex:1, alignItems:'center' },
  headerTitle: { ...typography.title3 },
  headerSub: { ...typography.caption, marginTop:2 },
  loadingBox: { flex:1, justifyContent:'center', alignItems:'center' },
  scroll: { paddingHorizontal:spacing.xl, paddingTop:spacing.sm },
  summaryCard: {
    borderRadius:borderRadius.xl, overflow:'hidden', borderWidth:1,
    marginBottom:spacing.lg, shadowOffset:{width:0,height:4}, shadowOpacity:1, shadowRadius:12, elevation:4,
  },
  blur: { overflow:'hidden' },
  summaryContent: { flexDirection:'row', alignItems:'center', padding:spacing.lg, gap:spacing.md },
  summaryIcon: { width:44, height:44, borderRadius:borderRadius.md, justifyContent:'center', alignItems:'center' },
  summaryText: { flex:1 },
  summaryTitle: { ...typography.headline },
  summaryCount: { ...typography.caption, marginTop:2 },
  miniStats: { flexDirection:'row', gap:spacing.md },
  miniStat: { alignItems:'center' },
  miniNum: { ...typography.headline },
  miniLabel: { ...typography.caption },
  typeTabs: { gap:spacing.sm, marginBottom:spacing.lg },
  typeTab: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:spacing.lg, paddingVertical:spacing.md,
    borderRadius:borderRadius.md, borderWidth:1.5, gap:spacing.sm,
  },
  typeTabLabel: { ...typography.subhead, fontWeight:'600', flex:1 },
  typeTabCount: { ...typography.footnote },
  monthLabel: { ...typography.headline, marginTop:spacing.lg, marginBottom:spacing.xs },
  dayRow: {
    flexDirection:'row', alignItems:'center', paddingVertical:6,
    borderBottomWidth:1, gap:spacing.md, paddingLeft:spacing.xs,
  },
  todayBar: { position:'absolute', left:0, top:4, bottom:4, width:3, borderRadius:2 },
  dateCol: { width:42, alignItems:'center' },
  dayNum: { ...typography.subhead, fontWeight:'600' },
  dayName: { ...typography.caption },
  divider: { width:1, height:30 },
  toggleBtn: {
    flexDirection:'row', alignItems:'center', gap:spacing.xs,
    paddingHorizontal:spacing.md, paddingVertical:spacing.xs, borderRadius:borderRadius.full,
  },
  toggleText: { ...typography.footnote, fontWeight:'600' },
  syawalNote: { ...typography.caption, marginLeft:'auto' },
  syawalInfo: {
    flexDirection:'row', alignItems:'flex-start', gap:spacing.sm,
    padding:spacing.md, borderRadius:borderRadius.md, marginTop:spacing.lg,
  },
  syawalInfoText: { ...typography.caption, flex:1 },
  emptyNote: { ...typography.subhead, textAlign:'center', marginTop:spacing.xxxl },
  arafahCard: {
    borderRadius:borderRadius.xl, overflow:'hidden', borderWidth:1.5,
    shadowOffset:{width:0,height:4}, shadowOpacity:1, shadowRadius:12, elevation:4,
  },
  arafahContent: { flexDirection:'row', alignItems:'center', padding:spacing.xl, gap:spacing.md },
  arafahIcon: { width:56, height:56, borderRadius:borderRadius.lg, justifyContent:'center', alignItems:'center' },
  arafahTitle: { ...typography.title3 },
  arafahDate: { ...typography.subhead, marginTop:2 },
  arafahNote: { ...typography.caption, marginTop:4, fontStyle:'italic' },
  doneBtn: { padding:spacing.sm, borderRadius:borderRadius.full },
});
