-- Migration: Only Super Admin Can Delete Data & Store Plain Password for Super Admin View
-- Date: 2026-11-01

-- 1. Add plain_password column to admin_profiles so Super Admin can view user passwords
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- 2. Volunteers policies: Only Super Admin can delete volunteers
DROP POLICY IF EXISTS "Admins manage volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Only admins can delete volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Only super admin can delete volunteers" ON public.volunteers;
CREATE POLICY "Only super admin can delete volunteers"
    ON public.volunteers FOR DELETE
    USING (public.is_super_admin());

-- 3. Seva Vibhag policies: Admins can INSERT and UPDATE, but ONLY Super Admin can DELETE
DROP POLICY IF EXISTS "Admin manage seva_vibhag" ON public.seva_vibhag;
DROP POLICY IF EXISTS "Only admins can manage seva vibhag" ON public.seva_vibhag;
DROP POLICY IF EXISTS "Admins can insert seva_vibhag" ON public.seva_vibhag;
CREATE POLICY "Admins can insert seva_vibhag"
    ON public.seva_vibhag FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update seva_vibhag" ON public.seva_vibhag;
CREATE POLICY "Admins can update seva_vibhag"
    ON public.seva_vibhag FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only super admin can delete seva_vibhag" ON public.seva_vibhag;
CREATE POLICY "Only super admin can delete seva_vibhag"
    ON public.seva_vibhag FOR DELETE
    USING (public.is_super_admin());
