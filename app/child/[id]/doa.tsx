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
import { useDoa, DOA_ITEMS } from '@/hooks/use-doa';
import { PremiumGate } from '@/components/premium-gate';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { DoaKey } from '@/types';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CURRENT_YEAR = new Date().getFullYear();
const TODAY = new Date();
const DOA_TOTAL = DOA_ITEMS.length; // 6

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

export default function DoaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { children } = useChildren();
  const { fetchDoaLogs, updateDoa, getDoaForDate, getDoaCountForDate, calculateStats, isLoading } = useDoa(id);
  const child = children.find((c) => c.id === id);
  const [selectedMonth, setSelectedMonth] = useState(TODAY.getMonth());

  useEffect(() => { fetchDoaLogs(); }, [fetchDoaLogs]);

  const stats = calculateStats();
  const selectedDays = useMemo(() => buildMonthDays(CURRENT_YEAR, selectedMonth), [selectedMonth]);

  const yearTotal = stats.total;
  const yearStart = new Date(CURRENT_YEAR, 0, 1);
  const daysElapsed = Math.max(1, Math.floor((TODAY.getTime() - yearStart.getTime()) / 86400000) + 1);
  const possibleSoFar = daysElapsed * DOA_TOTAL;
  const yearPct = Math.min(100, Math.round((yearTotal / possibleSoFar) * 100));

  const selectedMonthDone = useMemo(
    () => selectedDays.reduce((s, d) => s + getDoaCountForDate(d.date), 0),
    [selectedDays, getDoaCountForDate],
  );
  const selectedMonthPossible = selectedDays.filter((d) => !d.isFuture).length * DOA_TOTAL;
  const selectedMonthPct = selectedMonthPossible > 0
    ? Math.round((selectedMonthDone / selectedMonthPossible) * 100) : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A','#1E293B','#0F172A'] : ['#FFFFFF','#FFFFFF','#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.doaColor} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Doa Harian</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {child?.name ?? ''} — {CURRENT_YEAR}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <PremiumGate feature="Doa Harian checklist">
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.doaColor} />
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
                  <View style={[styles.summaryIcon, { backgroundColor: colors.doaMuted }]}>
                    <Ionicons name="heart" size={22} color={colors.doaColor} />
                  </View>
                  <View style={styles.summaryText}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>
                      {CURRENT_YEAR} Doas
                    </Text>
                    <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>
                      {yearTotal} / {possibleSoFar} doas
                    </Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.doaMuted }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.doaColor, width: `${yearPct}%` as any }]} />
                    </View>
                  </View>
                  <Text style={[styles.pctBadge, { color: colors.doaColor }]}>{yearPct}%</Text>
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
                // Quick month count from days
                const mDays = buildMonthDays(CURRENT_YEAR, month);
                const mDone = mDays.reduce((s, d) => s + getDoaCountForDate(d.date), 0);
                const mPossible = mDays.filter((d) => !d.isFuture).length * DOA_TOTAL;
                const mPct = mPossible > 0 ? Math.round((mDone / mPossible) * 100) : 0;

                return (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthCell,
                      {
                        backgroundColor: isSelected ? `${colors.doaColor}12` : colors.backgroundSecondary,
                        borderColor: isSelected ? colors.doaColor : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedMonth(month)}
                    activeOpacity={0.7}
                  >
                    {isCurrentMonth && <View style={[styles.currentDot, { backgroundColor: colors.doaColor }]} />}
                    <Text style={[styles.monthCellName, {
                      color: isSelected ? colors.doaColor : isFutureMonth ? colors.textMuted : colors.text,
                    }]}>
                      {MONTH_SHORT[month]}
                    </Text>
                    <Text style={[styles.monthCellCount, { color: colors.textSecondary }]}>
                      {isFutureMonth ? '—' : `${mPct}%`}
                    </Text>
                    <View style={[styles.miniTrack, { backgroundColor: colors.doaMuted }]}>
                      {!isFutureMonth && mPossible > 0 && (
                        <View style={[styles.miniFill, {
                          backgroundColor: colors.doaColor, width: `${mPct}%` as any, opacity: isSelected ? 1 : 0.6,
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
                  {selectedMonthDone}/{selectedMonthPossible} doas · {selectedMonthPct}%
                </Text>
              </View>
              <View style={[styles.pctChip, { backgroundColor: colors.doaMuted }]}>
                <Text style={[styles.pctChipText, { color: colors.doaColor }]}>
                  {selectedMonthPct}%
                </Text>
              </View>
            </View>

            {/* Column header */}
            <View style={[styles.colHeader, { borderBottomColor: colors.borderLight }]}>
              <View style={styles.colDate} />
              <View style={[styles.colDivider, { backgroundColor: 'transparent' }]} />
              <View style={styles.colDoas}>
                {DOA_ITEMS.map((d) => (
                  <Text key={d.key} style={[styles.colLabel, { color: colors.textMuted }]}>
                    {d.short}
                  </Text>
                ))}
              </View>
              <View style={styles.colCount} />
            </View>

            {/* Day rows */}
            {selectedDays.map((item) => {
              const doaLog = getDoaForDate(item.date);
              const doneCount = getDoaCountForDate(item.date);
              return (
                <View
                  key={item.date}
                  style={[
                    styles.dayRow,
                    { borderBottomColor: colors.borderLight },
                    item.isToday && { backgroundColor: `${colors.doaColor}08` },
                  ]}
                >
                  {item.isToday && <View style={[styles.todayBar, { backgroundColor: colors.doaColor }]} />}

                  <View style={styles.colDate}>
                    <Text style={[styles.dayNum, {
                      color: item.isToday ? colors.doaColor : item.isFuture ? colors.textMuted : colors.text,
                    }]}>
                      {item.dayNum}
                    </Text>
                    <Text style={[styles.dayName, { color: item.isToday ? colors.doaColor : colors.textMuted }]}>
                      {item.dayName}
                    </Text>
                  </View>

                  <View style={[styles.colDivider, { backgroundColor: colors.borderLight }]} />

                  <View style={styles.colDoas}>
                    {DOA_ITEMS.map((d) => {
                      const done = doaLog ? doaLog[d.key] : false;
                      return (
                        <TouchableOpacity
                          key={d.key}
                          style={[styles.doaBtn, { backgroundColor: done ? colors.doaColor : colors.doaMuted }]}
                          onPress={() => updateDoa(item.date, d.key as DoaKey, !done)}
                          activeOpacity={0.7}
                          hitSlop={{ top:4, bottom:4, left:2, right:2 }}
                        >
                          <Text style={[styles.doaBtnText, { color: done ? '#FFF' : colors.doaColor }]}>
                            {d.short}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.colCount}>
                    <Text style={[styles.countText, {
                      color: doneCount === DOA_TOTAL ? colors.doaColor
                        : doneCount > 0 ? colors.rewardColor : colors.borderLight,
                    }]}>
                      {doneCount}/{DOA_TOTAL}
                    </Text>
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
  colDoas: { flex:1, flexDirection:'row', gap:3, flexWrap:'wrap' },
  colCount: { width:34, alignItems:'flex-end' },
  colLabel: { flex:1, ...typography.caption, fontWeight:'700', textAlign:'center' },
  dayRow: {
    flexDirection:'row', alignItems:'center', paddingVertical:5,
    borderBottomWidth:1, gap:spacing.md, paddingLeft:spacing.xs, minHeight:44,
  },
  todayBar: { position:'absolute', left:0, top:4, bottom:4, width:3, borderRadius:2 },
  dayNum: { ...typography.subhead, fontWeight:'600', textAlign:'center' },
  dayName: { ...typography.caption, textAlign:'center' },
  doaBtn: {
    flex:1, alignItems:'center', justifyContent:'center',
    paddingVertical:4, borderRadius:borderRadius.sm, minWidth:0,
  },
  doaBtnText: { fontSize:9, fontWeight:'700', lineHeight:12 },
  countText: { ...typography.caption, fontWeight:'700', textAlign:'right' },
});
