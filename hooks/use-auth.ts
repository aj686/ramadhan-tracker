import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useChildrenStore } from '@/store/children-store';
import { useFastingStore } from '@/store/fasting-store';
import { usePrayerStore } from '@/store/prayer-store';
import { useRewardsStore } from '@/store/rewards-store';
import { useCallback, useEffect } from 'react';

export const useAuth = () => {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout: storeLogout } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

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
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }

      return { success: true, needsVerification: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

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
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

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

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state even if remote sign-out fails
      storeLogout();
      useChildrenStore.getState().clearChildren();
      useFastingStore.getState().clearLogs();
      useRewardsStore.getState().clearRewards();
      usePrayerStore.getState().clearLogs();
    }
  }, [storeLogout]);

  return {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    verifyOtp,
    resendVerification,
    logout,
  };
};
