// Supabase Edge Function: create-payment
// Creates a ToyyibPay bill and stores a pending subscription record.
//
// Required secrets (set via `supabase secrets set KEY=value`):
//   TOYYIBPAY_SECRET_KEY      — from ToyyibPay dashboard > Profile > Secret Key
//   TOYYIBPAY_CATEGORY_CODE   — from ToyyibPay dashboard > Category
//   TOYYIBPAY_SANDBOX         — "true" for sandbox, "false" for production
//   PAYMENT_CALLBACK_URL      — https://<project>.supabase.co/functions/v1/payment-callback
//   PAYMENT_RETURN_URL        — https://<project>.supabase.co/functions/v1/payment-return
//   SUPABASE_URL              — auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const IS_SANDBOX = Deno.env.get('TOYYIBPAY_SANDBOX') !== 'false';
const TOYYIBPAY_BASE = IS_SANDBOX
  ? 'https://dev.toyyibpay.com'
  : 'https://toyyibpay.com';

const SECRET_KEY     = Deno.env.get('TOYYIBPAY_SECRET_KEY')!;
const CATEGORY_CODE  = Deno.env.get('TOYYIBPAY_CATEGORY_CODE')!;
const CALLBACK_URL   = Deno.env.get('PAYMENT_CALLBACK_URL')!;
const RETURN_URL     = Deno.env.get('PAYMENT_RETURN_URL') ?? `${TOYYIBPAY_BASE}`;

const PLANS = {
  monthly: { label: 'MyLittleMuslim Premium (Monthly)', amount: 990 },
  yearly:  { label: 'MyLittleMuslim Premium (Yearly)',  amount: 4990 },
} as const;

type PlanId = keyof typeof PLANS;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });
  }

  // Parse request body
  let plan: PlanId;
  try {
    const body = await req.json();
    plan = body.plan;
    if (!plan || !PLANS[plan]) throw new Error('Invalid plan');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body. Provide { plan: "monthly" | "yearly" }' }), {
      status: 400, headers: CORS_HEADERS,
    });
  }

  const planDetails = PLANS[plan];
  const orderId = `MLM-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // Call ToyyibPay createBill API
  const params = new URLSearchParams({
    userSecretKey:            SECRET_KEY,
    categoryCode:             CATEGORY_CODE,
    billName:                 planDetails.label.slice(0, 30),
    billDescription:          planDetails.label,
    billPriceSetting:         '1',      // fixed price
    billPayorInfo:            '1',      // collect payer info
    billAmount:               String(planDetails.amount), // in sen
    billReturnUrl:            RETURN_URL,
    billCallbackUrl:          CALLBACK_URL,
    billExternalReferenceNo:  orderId,
    billTo:                   user.email ?? '',
    billEmail:                user.email ?? '',
    billPhone:                '0123456789',
    billSplitPayment:         '0',
    billSplitPaymentArgs:     '',
    billPaymentMethod:        '0',      // 0=all, 1=FPX, 2=CC
    billDisplayMerchant:      '1',
    billContentEmail:         `Thank you for subscribing to MyLittleMuslim ${plan} plan!`,
    billChargeToCustomer:     '1',
  });

  let billCode: string;
  try {
    const tpRes = await fetch(`${TOYYIBPAY_BASE}/index.php/api/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const tpData = await tpRes.json();

    if (!Array.isArray(tpData) || !tpData[0]?.BillCode) {
      console.error('ToyyibPay error:', tpData);
      return new Response(JSON.stringify({ error: 'Failed to create payment bill', detail: tpData }), {
        status: 502, headers: CORS_HEADERS,
      });
    }

    billCode = tpData[0].BillCode as string;
  } catch (err) {
    console.error('ToyyibPay fetch error:', err);
    return new Response(JSON.stringify({ error: 'Payment gateway unreachable' }), {
      status: 503, headers: CORS_HEADERS,
    });
  }

  // Store pending subscription in Supabase
  const { error: dbError } = await supabase.from('subscriptions').insert({
    user_id:   user.id,
    plan,
    status:    'pending',
    bill_code: billCode,
    order_id:  orderId,
    amount_rm: planDetails.amount / 100,
  });

  if (dbError) {
    console.error('DB insert error:', dbError);
    // Don't fail — bill was created, return it anyway
  }

  return new Response(
    JSON.stringify({
      billCode,
      paymentUrl: `${TOYYIBPAY_BASE}/${billCode}`,
      orderId,
    }),
    { headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
  );
});
