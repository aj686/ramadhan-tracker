import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const authStorageKey: string = supabase.auth['storageKey'];

export const readStoredAuthUser = async (): Promise<User | null> => {
  try {
    const stored = await AsyncStorage.getItem(authStorageKey);
    const user = stored ? JSON.parse(stored)?.user : null;
    return typeof user?.id === 'string' ? { id: user.id, email: user.email ?? '' } : null;
  } catch {
    return null;
  }
};

export const clearStoredAuthSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    authStorageKey,
    `${authStorageKey}-code-verifier`,
    `${authStorageKey}-user`,
  ]);
};
