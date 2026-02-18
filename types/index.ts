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

// Rewards settings
export interface Rewards {
  id: string;
  parent_id: string;
  full_day_amount: number;
  half_day_amount: number;
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
