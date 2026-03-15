import { useEffect } from 'react';
import { useSubscriptionStore } from '@/store/subscription-store';

// Returns real subscription status from Supabase subscriptions table.
// Checks on first mount — call checkSubscription() manually after payment.
export const useSubscription = () => {
  const {
    isPremium, plan, expiresAt, isChecking,
    checkSubscription, createPayment,
  } = useSubscriptionStore();

  useEffect(() => {
    checkSubscription();
  }, []);

  const maxChildren = isPremium ? Infinity : 2;

  return {
    isPremium,
    plan,
    expiresAt,
    isChecking,
    maxChildren,
    checkSubscription,
    createPayment,
    // Feature gates
    canAccessSunat:      isPremium,
    canAccessQuran:      isPremium,
    canAccessDoa:        isPremium,
    canAccessStreak:     isPremium,
    canAccessLeaderboard: isPremium,
    canAccessTransport:  isPremium,
    canAccessCountries:  isPremium,
    canExportReport:     isPremium,
  };
};
