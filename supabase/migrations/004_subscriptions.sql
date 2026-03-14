-- Phase 3: subscriptions table for ToyyibPay payment tracking
-- Run this in Supabase SQL Editor or via `supabase db push`

create table if not exists subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  plan       text check (plan in ('monthly','yearly')) not null,
  status     text check (status in ('pending','active','expired')) default 'pending',
  bill_code  text,
  order_id   text unique,
  amount_rm  numeric(8,2),
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

-- Users can only read their own subscription rows
create policy "Users read own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- INSERT and UPDATE are done via service_role in Edge Functions (no client insert policy needed)
-- If you want to allow the client to insert (not recommended), add:
-- create policy "Users insert own subscriptions" on subscriptions for insert with check (auth.uid() = user_id);
