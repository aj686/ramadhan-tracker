import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PRAYER_LABELS, type PlannedReminder } from './prayer-times';

// Local notifications only: scheduled on the phone, with no server, push token or tracking.
const CHANNEL_ID = 'prayer-reminders';

export const notificationsSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestReminderPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Peringatan Solat · Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

export const cancelReminders = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const scheduleReminders = async (reminders: PlannedReminder[]): Promise<void> => {
  await cancelReminders();
  await Promise.all(
    reminders.map(({ key, date }) => {
      const label = PRAYER_LABELS[key];
      return Notifications.scheduleNotificationAsync({
        content: {
          title: `Waktu ${label.ms} · ${label.en}`,
          body: 'Jom solat! · Time to pray.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: CHANNEL_ID,
        },
      });
    }),
  );
};
