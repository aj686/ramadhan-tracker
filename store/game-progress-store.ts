import { create } from 'zustand';
import type { ProfileProgress } from '@/services/game/progress';

interface GameProgressState {
  profiles: Record<string, ProfileProgress>;
  setProfile: (profileId: string, progress: ProfileProgress) => void;
  removeProfile: (profileId: string) => void;
  clearProfiles: () => void;
}

export const useGameProgressStore = create<GameProgressState>((set) => ({
  profiles: {},
  setProfile: (profileId, progress) =>
    set((state) => ({ profiles: { ...state.profiles, [profileId]: progress } })),
  removeProfile: (profileId) =>
    set((state) => {
      const { [profileId]: _removed, ...rest } = state.profiles;
      return { profiles: rest };
    }),
  clearProfiles: () => set({ profiles: {} }),
}));
