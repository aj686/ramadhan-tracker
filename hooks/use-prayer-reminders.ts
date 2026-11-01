import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cancelReminders,
  notificationsSupported,
  requestReminderPermission,
  scheduleReminders,
} from '@/services/notifications';
import { planReminders, PRAYER_ZONES, type PrayerKey } from '@/services/prayer-times';
import { ReminderSettings, useReminderStore } from '@/store/reminder-store';

const STORAGE_KEY = '@prayer_reminders_v1';
const DAYS_AHEAD = 7;
// Android and iOS both cap pending alarms. Seven days of five prayers stays well under.
const MAX_SCHEDULED = 40;

const zoneFor = (zoneId: string) => PRAYER_ZONES.find((zone) => zone.id === zoneId) ?? PRAYER_ZONES[0];

const persist = () => {
  const { enabled, zoneId, prayers } = useReminderStore.getState();
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, zoneId, prayers })).catch(() => {});
};

const reschedule = async () => {
  if (!notificationsSupported) return;
  const { enabled, zoneId, prayers } = useReminderStore.getState();
  if (!enabled) {
    await cancelReminders();
    return;
  }
  await scheduleReminders(planReminders(new Date(), zoneFor(zoneId), prayers, DAYS_AHEAD, MAX_SCHEDULED));
};

const loadSettings = async () => {
  const { applySettings, setLoaded, isLoaded } = useReminderStore.getState();
  if (isLoaded) return;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) applySettings(JSON.parse(stored) as Partial<ReminderSettings>);
  } catch {
    // keep defaults
  } finally {
    setLoaded(true);
  }
};

// Mounted once in the root layout. Reminders are only scheduled a week ahead,
// so opening the app tops them up and they never silently run out.
export const usePrayerReminderSync = () => {
  useEffect(() => {
    if (!notificationsSupported) return;

    const refresh = () => {
      loadSettings().then(reschedule).catch(() => {});
    };
    refresh();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);
};

export const usePrayerReminders = () => {
  const enabled = useReminderStore((state) => state.enabled);
  const zoneId = useReminderStore((state) => state.zoneId);
  const prayers = useReminderStore((state) => state.prayers);

  useEffect(() => {
    loadSettings();
  }, []);

  const update = useCallback(async (patch: Partial<ReminderSettings>) => {
    useReminderStore.getState().applySettings(patch);
    persist();
    await reschedule().catch(() => {});
  }, []);

  // Returns false if the phone refused permission, so the screen can explain it.
  const setEnabled = useCallback(
    async (next: boolean): Promise<boolean> => {
      if (next && !(await requestReminderPermission().catch(() => false))) return false;
      await update({ enabled: next });
      return true;
    },
    [update],
  );

  const setZone = useCallback((id: string) => update({ zoneId: id }), [update]);

  const togglePrayer = useCallback(
    (key: PrayerKey) => {
      const current = useReminderStore.getState().prayers;
      return update({ prayers: { ...current, [key]: !current[key] } });
    },
    [update],
  );

  return { enabled, zoneId, zone: zoneFor(zoneId), prayers, setEnabled, setZone, togglePrayer };
};
