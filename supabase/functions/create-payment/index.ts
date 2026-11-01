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
import { PLANS, toyyibpayBase, type PlanId } from '../_shared/toyyibpay.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  );
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  let plan: PlanId;
  try {
    const body = await req.json();
    plan = body.plan;
    if (!plan || !PLANS[plan]) throw new Error('Invalid plan');
  } catch {
    return json({ error: 'Invalid request body. Provide { plan: "monthly" | "yearly" }' }, 400);
  }

  const planDetails = PLANS[plan];
  const orderId = `MLM-${crypto.randomUUID()}`;

  // The pending row is saved first. If it cannot be saved, no bill is created,
  // so nobody can ever pay for a subscription the callback would not be able to find.
  const { data: pendingRow, error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan,
      status: 'pending',
      order_id: orderId,
      amount_rm: planDetails.amountSen / 100,
    })
    .select('id')
    .single();

  if (insertError || !pendingRow) {
    console.error('Could not save pending subscription:', insertError?.message);
    return json({ error: 'Could not start the payment. Please try again.' }, 500);
  }

  const params = new URLSearchParams({
    userSecretKey: Deno.env.get('TOYYIBPAY_SECRET_KEY')!,
    categoryCode: Deno.env.get('TOYYIBPAY_CATEGORY_CODE')!,
    billName: planDetails.label.slice(0, 30),
    billDescription: planDetails.label,
    billPriceSetting: '1',
    // 0 means ToyyibPay does not require payer details from us, so we never send a made-up phone number.
    billPayorInfo: '0',
    billAmount: String(planDetails.amountSen),
    billReturnUrl: Deno.env.get('PAYMENT_RETURN_URL') ?? toyyibpayBase(),
    billCallbackUrl: Deno.env.get('PAYMENT_CALLBACK_URL')!,
    billExternalReferenceNo: orderId,
    billEmail: user.email ?? '',
    billSplitPayment: '0',
    billSplitPaymentArgs: '',
    billPaymentMethod: '0',
    billDisplayMerchant: '1',
    billContentEmail: `Thank you for subscribing to MyLittleMuslim ${plan} plan!`,
    billChargeToCustomer: '1',
  });

  let billCode: string;
  try {
    const response = await fetch(`${toyyibpayBase()}/index.php/api/createBill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await response.json();

    if (!Array.isArray(data) || !data[0]?.BillCode) {
      console.error('ToyyibPay rejected the bill, status:', response.status);
      return json({ error: 'Failed to create payment bill' }, 502);
    }
    billCode = data[0].BillCode as string;
  } catch (err) {
    console.error('ToyyibPay unreachable:', err instanceof Error ? err.message : 'unknown error');
    return json({ error: 'Payment gateway unreachable' }, 503);
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ bill_code: billCode })
    .eq('id', pendingRow.id);

  if (updateError) {
    console.error('Could not save bill code:', updateError.message);
    return json({ error: 'Could not start the payment. Please try again.' }, 500);
  }

  return json({ billCode, paymentUrl: `${toyyibpayBase()}/${billCode}`, orderId });
});
