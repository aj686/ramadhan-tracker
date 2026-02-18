-- Ramadan Fasting Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLE: children
-- Stores children belonging to each parent
-- ============================================
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by parent
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- ============================================
-- TABLE: fasting_log
-- Daily fasting status for each child
-- ============================================
CREATE TABLE IF NOT EXISTS public.fasting_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('full', 'half', 'none')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each child can only have one entry per date
    UNIQUE(child_id, date)
);

-- Index for faster lookups by child
CREATE INDEX IF NOT EXISTS idx_fasting_log_child_id ON public.fasting_log(child_id);

-- ============================================
-- TABLE: rewards
-- Reward amounts per parent (one row per parent)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_day_amount NUMERIC(10, 2) DEFAULT 5.00,
    half_day_amount NUMERIC(10, 2) DEFAULT 2.50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each parent can only have one rewards row
    UNIQUE(parent_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each parent only sees their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasting_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHILDREN POLICIES
-- ============================================

-- Parents can view their own children
CREATE POLICY "Users can view own children"
    ON public.children FOR SELECT
    USING (auth.uid() = parent_id);

-- Parents can insert their own children
CREATE POLICY "Users can insert own children"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

-- Parents can update their own children
CREATE POLICY "Users can update own children"
    ON public.children FOR UPDATE
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);

-- Parents can delete their own children
CREATE POLICY "Users can delete own children"
    ON public.children FOR DELETE
    USING (auth.uid() = parent_id);

-- ============================================
-- FASTING_LOG POLICIES
-- ============================================

-- Parents can view fasting logs for their children
CREATE POLICY "Users can view fasting logs for own children"
    ON public.fasting_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = fasting_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can insert fasting logs for their children
CREATE POLICY "Users can insert fasting logs for own children"
    ON public.fasting_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = fasting_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can update fasting logs for their children
CREATE POLICY "Users can update fasting logs for own children"
    ON public.fasting_log FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = fasting_log.child_id
            AND children.parent_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = fasting_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can delete fasting logs for their children
CREATE POLICY "Users can delete fasting logs for own children"
    ON public.fasting_log FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = fasting_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- ============================================
-- REWARDS POLICIES
-- ============================================

-- Parents can view their own rewards
CREATE POLICY "Users can view own rewards"
    ON public.rewards FOR SELECT
    USING (auth.uid() = parent_id);

-- Parents can insert their own rewards
CREATE POLICY "Users can insert own rewards"
    ON public.rewards FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

-- Parents can update their own rewards
CREATE POLICY "Users can update own rewards"
    ON public.rewards FOR UPDATE
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);

-- Parents can delete their own rewards
CREATE POLICY "Users can delete own rewards"
    ON public.rewards FOR DELETE
    USING (auth.uid() = parent_id);

-- ============================================
-- HELPER FUNCTION: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for fasting_log
DROP TRIGGER IF EXISTS update_fasting_log_updated_at ON public.fasting_log;
CREATE TRIGGER update_fasting_log_updated_at
    BEFORE UPDATE ON public.fasting_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for rewards
DROP TRIGGER IF EXISTS update_rewards_updated_at ON public.rewards;
CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
