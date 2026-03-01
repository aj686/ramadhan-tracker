// User type from Supabase Auth
export interface User {
  id: string;
  email: string;
}

// Child entity
export interface Child {
  id: string;
  parent_id: string;
  name: string;
  created_at: string;
}

// Fasting status options
export type FastingStatus = 'full' | 'half' | 'none';

// Fasting log entry
export interface FastingLog {
  id: string;
  child_id: string;
  date: string; // YYYY-MM-DD format
  status: FastingStatus;
}

// Reward type
export type RewardType = 'money' | 'custom';

// Rewards settings
export interface Rewards {
  id: string;
  parent_id: string;
  full_day_amount: number;
  half_day_amount: number;
  reward_type: RewardType;
  custom_reward_full?: string | null;
  custom_reward_half?: string | null;
}

// Prayer names (5 daily prayers)
export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// Prayer log entry
export interface PrayerLog {
  id: string;
  child_id: string;
  date: string; // YYYY-MM-DD format
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

// For creating/updating children
export interface CreateChildInput {
  name: string;
}

export interface UpdateChildInput {
  name: string;
}

// For creating/updating fasting logs
export interface UpsertFastingLogInput {
  child_id: string;
  date: string;
  status: FastingStatus;
}

// For updating rewards
export interface UpdateRewardsInput {
  full_day_amount: number;
  half_day_amount: number;
  reward_type: RewardType;
  custom_reward_full?: string;
  custom_reward_half?: string;
}

// Calculated child stats
export interface ChildStats {
  fullDays: number;
  halfDays: number;
  noneDays: number;
  totalReward: number;
}

// Navigation param types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ChildDetail: { childId: string };
};

export type MainTabParamList = {
  Home: undefined;
  RewardsSetting: undefined;
};
