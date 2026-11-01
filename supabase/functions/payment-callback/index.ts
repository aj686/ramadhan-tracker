// Supabase Edge Function: payment-callback
// Receives the POST from ToyyibPay after a payment, then activates the subscription.
//
// This endpoint is public by necessity, so nothing in the request body is trusted:
//   1. the order must exist and its bill code must match;
//   2. the payment is re-confirmed with ToyyibPay's getBillTransactions;
//   3. the paid amount is compared against the plan's price;
//   4. only a 'pending' row can activate, so a replayed callback changes nothing.
//
// Deploy with --no-verify-jwt (see supabase/config.toml): ToyyibPay sends no auth header.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { calculateExpiry, fetchVerifiedPayment, isPaymentValid, PLANS, type PlanId } from '../_shared/toyyibpay.ts';

// Always 200 for anything final, or ToyyibPay keeps retrying a request that can never succeed.
const done = () => new Response('ok', { status: 200 });

const readBody = async (req: Request): Promise<Record<string, string> | null> => {
  const contentType = req.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) return await req.json();
    return Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await readBody(req);
  if (!body) return new Response('Bad request', { status: 400 });

  const { status, billcode: billCode, order_id: orderId, refno } = body;
  console.log('ToyyibPay callback:', { refno, status });

  // Only a success can change anything. A failed or pending payment leaves the row as it is.
  if (status !== '1' || !billCode || !orderId) return done();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan, status, bill_code')
    .eq('order_id', orderId)
    .maybeSingle();

  if (fetchError) {
    console.error('Could not read subscription:', fetchError.message);
    return new Response('Try again', { status: 500 });
  }

  if (!subscription || subscription.bill_code !== billCode) {
    console.warn('Callback did not match an order:', { refno });
    return done();
  }

  if (subscription.status !== 'pending') return done();

  const plan = subscription.plan as PlanId;
  if (!PLANS[plan]) return done();

  let payment;
  try {
    payment = await fetchVerifiedPayment(billCode);
  } catch (err) {
    // A gateway outage is temporary, so ask ToyyibPay to retry rather than losing a real payment.
    console.error('Could not verify payment:', err instanceof Error ? err.message : 'unknown error');
    return new Response('Try again', { status: 503 });
  }

  if (!payment || !isPaymentValid(payment, plan, orderId)) {
    console.warn('Payment failed verification:', { refno, paidSen: payment?.paidSen, plan });
    return done();
  }

  const now = new Date();
  const { data: latestActive } = await supabase
    .from('subscriptions')
    .select('expires_at')
    .eq('user_id', subscription.user_id)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const currentExpiry = latestActive?.expires_at ? new Date(latestActive.expires_at) : null;
  const expiresAt = calculateExpiry(plan, now, currentExpiry);

  // The status check makes this atomic: of two simultaneous callbacks, only one can win.
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscription.id)
    .eq('status', 'pending');

  if (updateError) {
    console.error('Could not activate subscription:', updateError.message);
    return new Response('Try again', { status: 500 });
  }

  return done();
});
