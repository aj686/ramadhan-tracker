// ToyyibPay client-side config and types.
// Secrets (userSecretKey, categoryCode) ONLY live in Supabase Edge Function environment variables.

export const TOYYIBPAY_SANDBOX = true; // Set to false for production

export const COMING_SOON_LABEL = 'Akan Datang · Coming Soon';

// Stays false until the hardened Edge Functions and their secrets are deployed and a sandbox
// payment has been tested end to end. While false, no payment can start from the app.
export const PAYMENT_OPEN = false;

export const PLANS = {
  monthly: {
    id:      'monthly' as const,
    label:   'Monthly',
    price:   'RM9.90',
    period:  'per month',
    amount:  990,         // in sen (RM9.90)
    savings: null,
  },
  yearly: {
    id:      'yearly' as const,
    label:   'Yearly',
    price:   'RM49.90',
    period:  'per year',
    amount:  4990,        // in sen (RM49.90)
    savings: 'Save 58%',
  },
} as const;

export type PlanId = keyof typeof PLANS;

export interface CreatePaymentResponse {
  billCode:   string;
  paymentUrl: string;
  orderId:    string;
}

export interface SubscriptionRow {
  id:         string;
  user_id:    string;
  plan:       PlanId;
  status:     'pending' | 'active' | 'expired';
  bill_code:  string | null;
  order_id:   string | null;
  amount_rm:  number | null;
  expires_at: string | null;
  created_at: string;
}
