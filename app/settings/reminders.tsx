import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoBack } from '@/hooks/use-go-back';
import { usePrayerReminders } from '@/hooks/use-prayer-reminders';
import { useTheme } from '@/hooks/use-theme';
import { Alert } from '@/services/alert';
import { notificationsSupported } from '@/services/notifications';
import {
  calculatePrayerTimes,
  formatMalaysiaTime,
  PRAYER_KEYS,
  PRAYER_LABELS,
  PRAYER_ZONES,
} from '@/services/prayer-times';
import { borderRadius, spacing, typography } from '@/constants/theme';

export default function RemindersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack('/(tabs)/profile');
  const { enabled, zoneId, zone, prayers, setEnabled, setZone, togglePrayer } = usePrayerReminders();
  const [isPickingZone, setIsPickingZone] = useState(false);

  const now = new Date();
  const dayKey = now.toDateString();
  const times = useMemo(() => {
    const today = new Date(dayKey);
    return calculatePrayerTimes(today.getFullYear(), today.getMonth() + 1, today.getDate(), zone);
  }, [dayKey, zone]);

  const handleToggle = async (next: boolean) => {
    const applied = await setEnabled(next);
    if (!applied) {
      Alert.alert(
        'Notifications are off',
        'Please allow notifications for MyLittleMuslim in your phone settings, then try again.',
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Prayer Reminders</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        {!notificationsSupported ? (
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            Reminders work in the Android and iPhone apps.
          </Text>
        ) : (
          <>
            <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceSolid }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Remind me to pray</Text>
                <Text style={[styles.rowSub, { color: colors.textSecondary }]}>A notification at each prayer time</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                accessibilityLabel="Remind me to pray"
                trackColor={{ true: colors.prayerColor, false: colors.border }}
              />
            </View>

            <Text style={[styles.section, { color: colors.text }]}>Your state</Text>
            <Pressable
              onPress={() => setIsPickingZone(!isPickingZone)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isPickingZone }}
              style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceSolid }]}
            >
              <Text style={[styles.rowTitle, styles.rowText, { color: colors.text }]}>{zone.name}</Text>
              <Ionicons name={isPickingZone ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </Pressable>

            {isPickingZone && (
              <View style={[styles.zoneList, { borderColor: colors.border, backgroundColor: colors.surfaceSolid }]}>
                {PRAYER_ZONES.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      setZone(option.id);
                      setIsPickingZone(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: option.id === zoneId }}
                    style={styles.zoneRow}
                  >
                    <Text style={[styles.rowSub, styles.rowText, { color: colors.text }]}>{option.name}</Text>
                    {option.id === zoneId && <Ionicons name="checkmark" size={18} color={colors.prayerColor} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.section, { color: colors.text }]}>Prayers</Text>
            {PRAYER_KEYS.map((key) => (
              <View key={key} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surfaceSolid }]}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    {PRAYER_LABELS[key].ms} · {PRAYER_LABELS[key].en}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Today about {formatMalaysiaTime(times[key])}
                  </Text>
                </View>
                <Switch
                  value={prayers[key]}
                  onValueChange={() => togglePrayer(key)}
                  disabled={!enabled}
                  accessibilityLabel={PRAYER_LABELS[key].en}
                  trackColor={{ true: colors.prayerColor, false: colors.border }}
                />
              </View>
            ))}

            <Text style={[styles.note, { color: colors.textMuted }]}>
              Times are estimated from your state and may differ by a few minutes. Please follow JAKIM&apos;s official
              timetable for your zone. Your state is saved only on this phone.
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...typography.title3, flex: 1 },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  rowText: { flex: 1 },
  rowTitle: { ...typography.callout, fontWeight: '600' },
  rowSub: { ...typography.footnote },
  section: { ...typography.headline, marginTop: spacing.sm },
  zoneList: { borderRadius: borderRadius.lg, borderWidth: 1, paddingVertical: spacing.xs },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  note: { ...typography.footnote, lineHeight: 18 },
});
