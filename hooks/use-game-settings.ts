import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AgeGroup, Lang } from '@/data/games/schema';
import { GAME_STRINGS } from '@/i18n/games';
import { GameSettings, useGameSettingsStore } from '@/store/game-settings-store';

const SETTINGS_KEY = '@games_settings_v1';

const isLang = (value: unknown): value is Lang => value === 'ms' || value === 'en';
const isAge = (value: unknown): value is AgeGroup => value === 'toddler' || value === 'preschool';

export const useGameSettings = () => {
  const language = useGameSettingsStore((state) => state.language);
  const muted = useGameSettingsStore((state) => state.muted);
  const ageGroup = useGameSettingsStore((state) => state.ageGroup);
  const activeChildId = useGameSettingsStore((state) => state.activeChildId);
  const isLoaded = useGameSettingsStore((state) => state.isLoaded);
  const setActiveChildId = useGameSettingsStore((state) => state.setActiveChildId);

  useEffect(() => {
    if (useGameSettingsStore.getState().isLoaded) return;
    const load = async () => {
      const { applySettings, setLoaded } = useGameSettingsStore.getState();
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed) {
          applySettings({
            ...(isLang(parsed.language) ? { language: parsed.language } : {}),
            ...(typeof parsed.muted === 'boolean' ? { muted: parsed.muted } : {}),
            ...(isAge(parsed.ageGroup) ? { ageGroup: parsed.ageGroup } : {}),
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const update = useCallback((patch: Partial<GameSettings>) => {
    const { applySettings } = useGameSettingsStore.getState();
    applySettings(patch);
    const { language: nextLanguage, muted: nextMuted, ageGroup: nextAge } = useGameSettingsStore.getState();
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ language: nextLanguage, muted: nextMuted, ageGroup: nextAge }),
    ).catch(() => {});
  }, []);

  const toggleLanguage = useCallback(() => {
    update({ language: useGameSettingsStore.getState().language === 'ms' ? 'en' : 'ms' });
  }, [update]);

  const toggleMuted = useCallback(() => {
    update({ muted: !useGameSettingsStore.getState().muted });
  }, [update]);

  const setAgeGroup = useCallback((next: AgeGroup) => update({ ageGroup: next }), [update]);

  return {
    language,
    muted,
    ageGroup,
    activeChildId,
    isLoaded,
    t: GAME_STRINGS[language],
    toggleLanguage,
    toggleMuted,
    setAgeGroup,
    setActiveChildId,
  };
};
