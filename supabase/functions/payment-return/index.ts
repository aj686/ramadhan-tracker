// Supabase Edge Function: payment-return
// ToyyibPay redirects the browser here after payment completes.
// Shows a simple "return to app" page.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MyLittleMuslim — Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F0FFF4;
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
    h1 { color: #166534; font-size: 24px; }
    p  { color: #4B5563; font-size: 16px; line-height: 1.5; max-width: 320px; }
    .note { font-size: 14px; color: #9CA3AF; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="emoji">🌙</div>
  <h1>Payment Received!</h1>
  <p>Thank you for subscribing to <strong>MyLittleMuslim Premium</strong>.</p>
  <p>Please return to the app and tap <strong>"Check Payment Status"</strong> to activate your subscription.</p>
  <p class="note">You can close this page now.</p>
</body>
</html>`;

serve(() => {
  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});
