import AsyncStorage from '@react-native-async-storage/async-storage';
import { isProfileProgress, ProfileProgress } from './progress';

// Device storage for now. A backend only has to replace these functions:
// the hooks do not know where progress is kept.
//
// Holds an opaque child or parent id plus stars and scores. Never a name or anything personal.
const KEY_PREFIX = '@games_progress_v1:';

export const loadProfileProgress = async (profileId: string): Promise<ProfileProgress> => {
  try {
    const stored = await AsyncStorage.getItem(`${KEY_PREFIX}${profileId}`);
    const parsed: unknown = stored ? JSON.parse(stored) : {};
    return isProfileProgress(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const saveProfileProgress = async (profileId: string, progress: ProfileProgress): Promise<void> => {
  await AsyncStorage.setItem(`${KEY_PREFIX}${profileId}`, JSON.stringify(progress));
};

export const removeProfileProgress = async (profileId: string): Promise<void> => {
  await AsyncStorage.removeItem(`${KEY_PREFIX}${profileId}`);
};

export const clearAllGameProgress = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(KEY_PREFIX)));
};
