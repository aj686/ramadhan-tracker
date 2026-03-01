-- Migration: Create prayer_log table for tracking 5 daily prayers per child
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.prayer_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    fajr BOOLEAN NOT NULL DEFAULT FALSE,
    dhuhr BOOLEAN NOT NULL DEFAULT FALSE,
    asr BOOLEAN NOT NULL DEFAULT FALSE,
    maghrib BOOLEAN NOT NULL DEFAULT FALSE,
    isha BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(child_id, date)
);

CREATE INDEX IF NOT EXISTS idx_prayer_log_child_id ON public.prayer_log(child_id);

-- Enable Row Level Security
ALTER TABLE public.prayer_log ENABLE ROW LEVEL SECURITY;

-- Parents can view prayer logs for their children
CREATE POLICY "Users can view prayer logs for own children"
    ON public.prayer_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = prayer_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can insert prayer logs for their children
CREATE POLICY "Users can insert prayer logs for own children"
    ON public.prayer_log FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = prayer_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can update prayer logs for their children
CREATE POLICY "Users can update prayer logs for own children"
    ON public.prayer_log FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = prayer_log.child_id
            AND children.parent_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = prayer_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Parents can delete prayer logs for their children
CREATE POLICY "Users can delete prayer logs for own children"
    ON public.prayer_log FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = prayer_log.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_prayer_log_updated_at ON public.prayer_log;
CREATE TRIGGER update_prayer_log_updated_at
    BEFORE UPDATE ON public.prayer_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
