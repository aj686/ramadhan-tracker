import { useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useRewardsStore } from '@/store/rewards-store';
import { useAuthStore } from '@/store/auth-store';
import { Rewards, UpdateRewardsInput } from '@/types';

const DEFAULT_FULL_DAY_AMOUNT = 5;
const DEFAULT_HALF_DAY_AMOUNT = 2.5;
const DEFAULT_REWARD_TYPE = 'money' as const;

export const useRewards = () => {
  const { user } = useAuthStore();
  const { rewards, isLoading, error, setRewards, setLoading, setError } = useRewardsStore();

  const fetchRewards = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('rewards')
        .select('*')
        .eq('parent_id', user.id)
        .single();

      if (fetchError) {
        // If no rewards exist, create default rewards
        if (fetchError.code === 'PGRST116') {
          const { data: newRewards, error: createError } = await supabase
            .from('rewards')
            .insert({
              parent_id: user.id,
              full_day_amount: DEFAULT_FULL_DAY_AMOUNT,
              half_day_amount: DEFAULT_HALF_DAY_AMOUNT,
              reward_type: DEFAULT_REWARD_TYPE,
            })
            .select()
            .single();

          if (createError) throw createError;
          setRewards(newRewards as Rewards);
          return;
        }
        throw fetchError;
      }

      // Normalise legacy rows that don't have reward_type yet
      const normalised: Rewards = {
        ...(data as Rewards),
        reward_type: (data as any).reward_type ?? DEFAULT_REWARD_TYPE,
      };
      setRewards(normalised);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rewards';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, setRewards, setLoading, setError]);

  const updateRewards = useCallback(async (input: UpdateRewardsInput) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('rewards')
        .upsert(
          {
            parent_id: user.id,
            full_day_amount: input.full_day_amount,
            half_day_amount: input.half_day_amount,
            reward_type: input.reward_type,
            custom_reward_full: input.custom_reward_full ?? null,
            custom_reward_half: input.custom_reward_half ?? null,
          },
          {
            onConflict: 'parent_id',
          }
        )
        .select()
        .single();

      if (updateError) throw updateError;

      setRewards(data as Rewards);
      return { success: true, rewards: data as Rewards };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update rewards';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [user, setRewards, setLoading, setError]);

  return {
    rewards,
    isLoading,
    error,
    fetchRewards,
    updateRewards,
    defaultFullAmount: DEFAULT_FULL_DAY_AMOUNT,
    defaultHalfAmount: DEFAULT_HALF_DAY_AMOUNT,
  };
};
