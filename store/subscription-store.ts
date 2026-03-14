import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import type { CreatePaymentResponse, PlanId } from '@/services/toyyibpay';

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly';

interface SubscriptionState {
  isPremium:    boolean;
  plan:         SubscriptionPlan;
  expiresAt:    string | null;
  isChecking:   boolean;
  // Actions
  setPremium:          (isPremium: boolean, plan?: SubscriptionPlan, expiresAt?: string | null) => void;
  clearSubscription:   () => void;
  checkSubscription:   () => Promise<void>;
  createPayment:       (plan: PlanId) => Promise<CreatePaymentResponse>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium:  false,
  plan:       'free',
  expiresAt:  null,
  isChecking: false,

  setPremium: (isPremium, plan = 'free', expiresAt = null) =>
    set({ isPremium, plan, expiresAt }),

  clearSubscription: () =>
    set({ isPremium: false, plan: 'free', expiresAt: null }),

  // Checks Supabase subscriptions table for an active, non-expired subscription.
  checkSubscription: async () => {
    set({ isChecking: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ isPremium: false, plan: 'free', expiresAt: null, isChecking: false });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        set({ isPremium: false, plan: 'free', expiresAt: null });
      } else {
        const now = new Date();
        const expiry = data.expires_at ? new Date(data.expires_at) : null;
        const isActive = expiry ? expiry > now : false;

        set({
          isPremium: isActive,
          plan:      isActive ? (data.plan as SubscriptionPlan) : 'free',
          expiresAt: data.expires_at,
        });
      }
    } catch {
      // Network error — keep current state
    } finally {
      set({ isChecking: false });
    }
  },

  // Calls the create-payment Edge Function to create a ToyyibPay bill.
  createPayment: async (plan: PlanId): Promise<CreatePaymentResponse> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: { session: freshSession } } = await supabase.auth.getSession();
    const accessToken = freshSession?.access_token;
    if (!accessToken) throw new Error('No access token');

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const res = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ plan }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error ?? 'Payment creation failed');
    }

    return res.json() as Promise<CreatePaymentResponse>;
  },
}));
