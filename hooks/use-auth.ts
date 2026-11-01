import { clearAllGameProgress } from '@/services/game/progress-storage';
import { clearStoredAuthSession, readStoredAuthUser, supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useChildrenStore } from '@/store/children-store';
import { useDoaStore } from '@/store/doa-store';
import { useFastingStore } from '@/store/fasting-store';
import { useGameProgressStore } from '@/store/game-progress-store';
import { useGameSettingsStore } from '@/store/game-settings-store';
import { usePrayerStore } from '@/store/prayer-store';
import { useQuranStore } from '@/store/quran-store';
import { useRewardsStore } from '@/store/rewards-store';
import { useSubscriptionStore } from '@/store/subscription-store';
import { useSunatStore } from '@/store/sunat-store';
import { useCallback, useEffect } from 'react';

type SessionUser = { id: string; email?: string | null };

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

const clearUserData = () => {
  useChildrenStore.getState().clearChildren();
  useFastingStore.getState().clearLogs();
  usePrayerStore.getState().clearLogs();
  useSunatStore.getState().clearLogs();
  useQuranStore.getState().clearLogs();
  useDoaStore.getState().clearLogs();
  useRewardsStore.getState().clearRewards();
  useSubscriptionStore.getState().clearSubscription();
  // Game progress stays on disk under its child id, so only the in-memory copy is cleared here.
  useGameProgressStore.getState().clearProfiles();
  useGameSettingsStore.getState().setActiveChildId(null);
};

const applySessionUser = (sessionUser: SessionUser | null) => {
  const { user: currentUser, setUser } = useAuthStore.getState();
  const nextUser = sessionUser ? { id: sessionUser.id, email: sessionUser.email || '' } : null;

  if (currentUser?.id === nextUser?.id && currentUser?.email === nextUser?.email) return;
  if (currentUser && currentUser.id !== nextUser?.id) clearUserData();

  setUser(nextUser);
};

const endLocalSession = async (): Promise<boolean> => {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (!error) return true;

  await clearStoredAuthSession();
  await supabase.auth.signOut({ scope: 'local' });
  return false;
};

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setLoading, logout: storeLogout } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isOffline()) {
          const storedUser = await readStoredAuthUser();
          if (storedUser) {
            applySessionUser(storedUser);
            setLoading(false);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        applySessionUser(session?.user ?? (await readStoredAuthUser()));
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        clearUserData();
        storeLogout();
      } else {
        applySessionUser(session?.user ?? (await readStoredAuthUser()));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setLoading, storeLogout]);

  const register = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const needsVerification =
        data.user && !data.session;

      if (needsVerification) {
        return { success: true, needsVerification: true };
      }

      if (data.user) {
        applySessionUser(data.user);
      }

      return { success: true, needsVerification: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        applySessionUser(data.user);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) throw error;

      if (data.user) {
        applySessionUser(data.user);
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const resendVerification = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend';
      return { success: false, error: message };
    }
  }, []);

  // Always reports success for a valid request, so the form cannot reveal which emails have accounts.
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error && error.status !== 400 && error.status !== 422) throw error;
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send the code';
      return { success: false, error: message };
    }
  }, []);

  // The code signs the parent in, so the password must change in the same step.
  // Otherwise the root layout would redirect to the tabs with the old password still set.
  const resetPassword = useCallback(async (email: string, token: string, newPassword: string) => {
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reset the password';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  // Runs in an Edge Function because deleting an auth user needs the service role.
  // Children and every tracker row go with it through ON DELETE CASCADE.
  const deleteAccount = useCallback(async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw error;

      await clearStoredAuthSession().catch(() => {});
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      await clearAllGameProgress().catch(() => {});
      clearUserData();
      storeLogout();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete the account';
      return { success: false, error: message };
    }
  }, [storeLogout]);

  const logout = useCallback(async () => {
    let serverReached = false;
    try {
      serverReached = await endLocalSession();
    } catch {
      await clearStoredAuthSession().catch(() => {});
    } finally {
      clearUserData();
      storeLogout();
    }
    return { serverReached };
  }, [storeLogout]);

  return {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    verifyOtp,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    deleteAccount,
    logout,
  };
};
