// Supabase Edge Function: payment-return
// ToyyibPay sends the browser here after a payment attempt, with status_id in the URL.
// This page only informs. It activates nothing: activation happens in payment-callback.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const MESSAGES: Record<string, { emoji: string; title: string; body: string }> = {
  '1': {
    emoji: '🌙',
    title: 'Payment received',
    body: 'Thank you for subscribing to <strong>MyLittleMuslim Premium</strong>. Please return to the app and tap <strong>Check Payment Status</strong>.',
  },
  '2': {
    emoji: '⏳',
    title: 'Payment pending',
    body: 'Your bank is still processing this. Please return to the app and check again in a few minutes.',
  },
  '3': {
    emoji: '🤲',
    title: 'Payment not completed',
    body: 'No money was taken. Please return to the app if you would like to try again.',
  },
};

const page = (statusId: string | null) => {
  const message = MESSAGES[statusId ?? ''] ?? MESSAGES['2'];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyLittleMuslim — Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F9F8FD;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
      gap: 16px;
    }
    .emoji { font-size: 64px; }
    h1 { color: #1F1B3A; font-size: 24px; }
    p  { color: #5B5970; font-size: 16px; line-height: 1.5; max-width: 320px; }
    .note { font-size: 14px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="emoji">${message.emoji}</div>
  <h1>${message.title}</h1>
  <p>${message.body}</p>
  <p class="note">You can close this page now.</p>
</body>
</html>`;
};

serve((req) =>
  new Response(page(new URL(req.url).searchParams.get('status_id')), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }),
);
