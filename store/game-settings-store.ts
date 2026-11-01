import { create } from 'zustand';
import type { AgeGroup, Lang } from '@/data/games/schema';

export interface GameSettings {
  language: Lang;
  muted: boolean;
  ageGroup: AgeGroup;
}

interface GameSettingsState extends GameSettings {
  activeChildId: string | null;
  isLoaded: boolean;
  applySettings: (settings: Partial<GameSettings>) => void;
  setActiveChildId: (childId: string | null) => void;
  setLoaded: (isLoaded: boolean) => void;
}

export const useGameSettingsStore = create<GameSettingsState>((set) => ({
  language: 'ms',
  muted: false,
  ageGroup: 'toddler',
  activeChildId: null,
  isLoaded: false,
  applySettings: (settings) => set(settings),
  setActiveChildId: (activeChildId) => set({ activeChildId }),
  setLoaded: (isLoaded) => set({ isLoaded }),
}));
