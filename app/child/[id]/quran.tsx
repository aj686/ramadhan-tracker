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
import { useQuran, QURAN_TOTAL_PAGES } from '@/hooks/use-quran';
import { PremiumGate } from '@/components/premium-gate';
import { borderRadius, spacing, typography } from '@/constants/theme';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CURRENT_YEAR = new Date().getFullYear();
const TODAY = new Date();

function buildMonthDays(year: number, month: number) {
  const todayMs = new Date(new Date().toDateString()).getTime();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const d = new Date(year, month, day);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return {
      date: `${year}-${mm}-${dd}`,
      dayNum: day,
      dayName: DAY_SHORT[d.getDay()],
      isToday: d.getTime() === todayMs,
      isFuture: d.getTime() > todayMs,
    };
  });
}

export default function QuranScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { children } = useChildren();
  const { fetchQuranLogs, updatePages, getPagesForDate, calculateStats, getMonthPages, isLoading } = useQuran(id);
  const child = children.find((c) => c.id === id);
  const [selectedMonth, setSelectedMonth] = useState(TODAY.getMonth());

  useEffect(() => { fetchQuranLogs(); }, [fetchQuranLogs]);

  const stats = calculateStats();
  const selectedDays = useMemo(() => buildMonthDays(CURRENT_YEAR, selectedMonth), [selectedMonth]);

  // Per-month page totals for grid
  const monthPages = useMemo(
    () => Array.from({ length: 12 }, (_, m) => {
      const mm = String(m + 1).padStart(2, '0');
      return getMonthPages(`${CURRENT_YEAR}-${mm}`);
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getMonthPages, stats.totalPages],
  );

  const selectedMonthTotal = monthPages[selectedMonth];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A','#1E293B','#0F172A'] : ['#FFFFFF','#FFFFFF','#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.quranColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Quran Reading</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {child?.name ?? ''} — {CURRENT_YEAR}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <PremiumGate feature="Quran Reading tracker">
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.quranColor} />
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
                  <View style={[styles.summaryIcon, { backgroundColor: colors.quranMuted }]}>
                    <Ionicons name="book" size={22} color={colors.quranColor} />
                  </View>
                  <View style={styles.summaryText}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>
                      {stats.totalPages} / {QURAN_TOTAL_PAGES} pages
                    </Text>
                    <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
                      Avg {stats.avgPerDay} pages/day · {stats.daysWithReading} days
                    </Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.quranMuted }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.quranColor, width: `${stats.pct}%` as any }]} />
                    </View>
                  </View>
                  <Text style={[styles.pctBadge, { color: colors.quranColor }]}>{stats.pct}%</Text>
                </View>
              </BlurView>
            </View>

            {/* Month grid */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Month</Text>
            <View style={styles.monthGrid}>
              {Array.from({ length: 12 }, (_, month) => {
                const isSelected = month === selectedMonth;
                const isCurrentMonth = month === TODAY.getMonth();
                const isFutureMonth = month > TODAY.getMonth();
                const pages = monthPages[month];
                return (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthCell,
                      {
                        backgroundColor: isSelected ? `${colors.quranColor}12` : colors.backgroundSecondary,
                        borderColor: isSelected ? colors.quranColor : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedMonth(month)}
                    activeOpacity={0.7}
                  >
                    {isCurrentMonth && (
                      <View style={[styles.currentDot, { backgroundColor: colors.quranColor }]} />
                    )}
                    <Text style={[styles.monthCellName, {
                      color: isSelected ? colors.quranColor : isFutureMonth ? colors.textMuted : colors.text,
                    }]}>
                      {MONTH_SHORT[month]}
                    </Text>
                    <Text style={[styles.monthCellCount, { color: colors.textSecondary }]}>
                      {isFutureMonth ? '—' : `${pages}p`}
                    </Text>
                    <View style={[styles.miniTrack, { backgroundColor: colors.quranMuted }]}>
                      {!isFutureMonth && pages > 0 && (
                        <View style={[styles.miniFill, {
                          backgroundColor: colors.quranColor,
                          width: `${Math.min(100, Math.round((pages / 50) * 100))}%` as any,
                          opacity: isSelected ? 1 : 0.6,
                        }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected month header */}
            <View style={[styles.monthDetailHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.monthDetailTitle, { color: colors.text }]}>
                  {MONTH_NAMES[selectedMonth]}
                </Text>
                <Text style={[styles.monthDetailSub, { color: colors.textSecondary }]}>
                  {selectedMonthTotal} pages this month
                </Text>
              </View>
              <View style={[styles.pctChip, { backgroundColor: colors.quranMuted }]}>
                <Text style={[styles.pctChipText, { color: colors.quranColor }]}>
                  {selectedMonthTotal}p
                </Text>
              </View>
            </View>

            {/* Column labels */}
            <View style={[styles.colHeader, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.colDate} />
              <View style={[styles.colDivider, { backgroundColor: 'transparent' }]} />
              <Text style={[styles.colLabel, { color: colors.textMuted, flex: 1 }]}>Pages Read</Text>
              <View style={styles.colStepper} />
            </View>

            {/* Day rows */}
            {selectedDays.map((item) => {
              const pages = getPagesForDate(item.date);
              return (
                <View
                  key={item.date}
                  style={[
                    styles.dayRow,
                    { borderBottomColor: colors.borderLight },
                    item.isToday && { backgroundColor: `${colors.quranColor}08` },
                  ]}
                >
                  {item.isToday && <View style={[styles.todayBar, { backgroundColor: colors.quranColor }]} />}

                  {/* Date */}
                  <View style={styles.colDate}>
                    <Text style={[styles.dayNum, {
                      color: item.isToday ? colors.quranColor : item.isFuture ? colors.textMuted : colors.text,
                    }]}>
                      {item.dayNum}
                    </Text>
                    <Text style={[styles.dayName, { color: item.isToday ? colors.quranColor : colors.textMuted }]}>
                      {item.dayName}
                    </Text>
                  </View>

                  <View style={[styles.colDivider, { backgroundColor: colors.borderLight }]} />

                  {/* Pages display */}
                  <Text style={[styles.pagesDisplay, {
                    color: pages > 0 ? colors.quranColor : colors.textMuted,
                    flex: 1,
                  }]}>
                    {pages > 0 ? `${pages} page${pages !== 1 ? 's' : ''}` : '—'}
                  </Text>

                  {/* Stepper */}
                  <View style={styles.colStepper}>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: colors.quranMuted }]}
                      onPress={() => updatePages(item.date, pages - 1)}
                      disabled={pages === 0}
                    >
                      <Ionicons name="remove" size={14} color={pages === 0 ? colors.borderLight : colors.quranColor} />
                    </TouchableOpacity>
                    <Text style={[styles.stepNum, { color: colors.text }]}>{pages}</Text>
                    <TouchableOpacity
                      style={[styles.stepBtn, { backgroundColor: colors.quranColor }]}
                      onPress={() => updatePages(item.date, pages + 1)}
                    >
                      <Ionicons name="add" size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    marginBottom:spacing.xl, shadowOffset:{width:0,height:4}, shadowOpacity:1, shadowRadius:12, elevation:4,
  },
  blur: { overflow:'hidden' },
  summaryContent: { flexDirection:'row', alignItems:'center', padding:spacing.lg, gap:spacing.md },
  summaryIcon: { width:44, height:44, borderRadius:borderRadius.md, justifyContent:'center', alignItems:'center' },
  summaryText: { flex:1 },
  summaryTitle: { ...typography.headline },
  summaryCount: { ...typography.caption, marginTop:2, marginBottom:spacing.xs },
  progressTrack: { height:6, borderRadius:3, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:3 },
  pctBadge: { ...typography.headline, fontWeight:'700' },
  sectionLabel: { ...typography.headline, marginBottom:spacing.md },
  monthGrid: { flexDirection:'row', flexWrap:'wrap', gap:spacing.sm, marginBottom:spacing.xl },
  monthCell: {
    width:'23%', borderRadius:borderRadius.md, paddingVertical:spacing.sm, paddingHorizontal:spacing.xs,
    alignItems:'center', borderWidth:1.5, gap:2, position:'relative',
  },
  currentDot: { position:'absolute', top:5, right:6, width:6, height:6, borderRadius:3 },
  monthCellName: { ...typography.footnote, fontWeight:'700' },
  monthCellCount: { fontSize:10, lineHeight:13 },
  miniTrack: { width:'85%', height:3, borderRadius:2, overflow:'hidden', marginTop:2 },
  miniFill: { height:'100%', borderRadius:2 },
  monthDetailHeader: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingBottom:spacing.md, borderBottomWidth:1, marginBottom:spacing.xs,
  },
  monthDetailTitle: { ...typography.title3 },
  monthDetailSub: { ...typography.caption },
  pctChip: { paddingHorizontal:spacing.md, paddingVertical:spacing.xs, borderRadius:borderRadius.full },
  pctChipText: { ...typography.footnote, fontWeight:'700' },
  colHeader: {
    flexDirection:'row', alignItems:'center', gap:spacing.md,
    paddingVertical:spacing.xs, borderBottomWidth:1, marginBottom:2,
  },
  colDate: { width:42, alignItems:'center' },
  colDivider: { width:1, height:16 },
  colLabel: { ...typography.caption, fontWeight:'700' },
  colStepper: { flexDirection:'row', alignItems:'center', gap:spacing.xs },
  dayRow: {
    flexDirection:'row', alignItems:'center', paddingVertical:6,
    borderBottomWidth:1, gap:spacing.md, paddingLeft:spacing.xs,
  },
  todayBar: { position:'absolute', left:0, top:4, bottom:4, width:3, borderRadius:2 },
  dayNum: { ...typography.subhead, fontWeight:'600', textAlign:'center' },
  dayName: { ...typography.caption, textAlign:'center' },
  pagesDisplay: { ...typography.subhead },
  stepBtn: {
    width:28, height:28, borderRadius:borderRadius.sm,
    justifyContent:'center', alignItems:'center',
  },
  stepNum: { ...typography.subhead, fontWeight:'700', minWidth:24, textAlign:'center' },
});
