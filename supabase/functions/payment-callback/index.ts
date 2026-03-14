// Supabase Edge Function: payment-callback
// Receives POST callback from ToyyibPay after user pays.
// Updates subscription status to 'active' and sets expiry date.
//
// ToyyibPay callback POST fields:
//   refno      — ToyyibPay transaction reference number
//   status     — "1"=success, "2"=pending, "3"=failed
//   reason     — description
//   billcode   — the bill code
//   order_id   — our external reference (billExternalReferenceNo)
//   amount     — amount paid in sen
//
// This endpoint must be publicly accessible (no auth header from ToyyibPay).
// Security: we validate order_id exists in our DB (we created it, it's a random ID).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let refno: string, status: string, billcode: string, orderId: string, amount: string;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    refno    = params.get('refno')    ?? '';
    status   = params.get('status')   ?? '';
    billcode = params.get('billcode') ?? '';
    orderId  = params.get('order_id') ?? '';
    amount   = params.get('amount')   ?? '';
  } else {
    // Some ToyyibPay versions send JSON
    try {
      const body = await req.json();
      refno    = body.refno    ?? '';
      status   = body.status   ?? '';
      billcode = body.billcode ?? '';
      orderId  = body.order_id ?? '';
      amount   = body.amount   ?? '';
    } catch {
      return new Response('Bad request', { status: 400 });
    }
  }

  console.log('ToyyibPay callback:', { refno, status, billcode, orderId, amount });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (status === '1') {
    // Payment success — find the pending subscription by order_id
    const { data: sub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, plan')
      .eq('order_id', orderId)
      .single();

    if (fetchError || !sub) {
      console.error('Subscription not found for order_id:', orderId, fetchError);
      // Return 200 to ToyyibPay so it doesn't retry endlessly
      return new Response('ok', { status: 200 });
    }

    // Calculate expiry based on plan
    const now = new Date();
    let expiresAt: Date;
    if (sub.plan === 'yearly') {
      expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status:     'active',
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);

    if (updateError) {
      console.error('Failed to activate subscription:', updateError);
    } else {
      console.log(`Subscription ${sub.id} activated. Expires: ${expiresAt.toISOString()}`);
    }
  } else if (status === '3') {
    // Payment failed — log it (keep status as 'pending' or mark failed if desired)
    console.log('Payment failed for order_id:', orderId, 'reason:', billcode);
  }

  // Always return 200 to ToyyibPay
  return new Response('ok', { status: 200 });
});
