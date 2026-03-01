import { useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useChildrenStore } from '@/store/children-store';
import { useFastingStore } from '@/store/fasting-store';
import { useRewardsStore } from '@/store/rewards-store';
import { usePrayerStore } from '@/store/prayer-store';

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
        options: {
          // Skip email verification - user is logged in immediately
          emailRedirectTo: undefined,
        },
      });

      if (error) throw error;

      // With email verification disabled in Supabase dashboard,
      // the user session is created immediately
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
        });
      }

      return { success: true };
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
    logout,
  };
};
