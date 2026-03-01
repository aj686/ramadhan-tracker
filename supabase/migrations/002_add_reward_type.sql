-- Migration: Add reward_type and custom reward fields to rewards table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS reward_type TEXT DEFAULT 'money' CHECK (reward_type IN ('money', 'custom')),
  ADD COLUMN IF NOT EXISTS custom_reward_full TEXT,
  ADD COLUMN IF NOT EXISTS custom_reward_half TEXT;

-- Backfill existing rows
UPDATE public.rewards SET reward_type = 'money' WHERE reward_type IS NULL;
