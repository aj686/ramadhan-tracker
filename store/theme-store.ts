import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@theme_preference';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  loadPreference: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'light',

  setPreference: (preference) => {
    set({ preference });
    AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => {});
  },

  loadPreference: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        set({ preference: saved });
      }
    } catch {
      // keep default
    }
  },
}));
