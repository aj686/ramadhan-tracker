import { create } from 'zustand';
import { DEFAULT_ZONE_ID, type PrayerKey } from '@/services/prayer-times';

export interface ReminderSettings {
  enabled: boolean;
  zoneId: string;
  prayers: Record<PrayerKey, boolean>;
}

interface ReminderState extends ReminderSettings {
  isLoaded: boolean;
  applySettings: (settings: Partial<ReminderSettings>) => void;
  setLoaded: (isLoaded: boolean) => void;
}

export const useReminderStore = create<ReminderState>((set) => ({
  enabled: false,
  zoneId: DEFAULT_ZONE_ID,
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  isLoaded: false,
  applySettings: (settings) => set(settings),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
