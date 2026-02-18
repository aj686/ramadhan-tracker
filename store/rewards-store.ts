import { create } from 'zustand';
import { Rewards } from '@/types';

interface RewardsState {
  rewards: Rewards | null;
  isLoading: boolean;
  error: string | null;
  setRewards: (rewards: Rewards | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearRewards: () => void;
}

export const useRewardsStore = create<RewardsState>((set) => ({
  rewards: null,
  isLoading: false,
  error: null,
  setRewards: (rewards) => set({ rewards }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearRewards: () => set({ rewards: null, error: null }),
}));
