import type { PlannedReminder } from './prayer-times';

// Browsers cannot reliably fire a scheduled notification while the page is closed,
// so reminders are Android and iOS only and the settings entry is hidden on web.
export const notificationsSupported = false;

export const requestReminderPermission = async (): Promise<boolean> => false;

export const cancelReminders = async (): Promise<void> => {};

export const scheduleReminders = async (_reminders: PlannedReminder[]): Promise<void> => {};
