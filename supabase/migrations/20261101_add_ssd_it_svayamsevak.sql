-- Migration: Add SSD IT Svayamsevak Role and Approval Flow
-- Date: 2026-11-01

-- 1. Modify role check constraint
ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE public.admin_profiles ADD CONSTRAINT admin_profiles_role_check CHECK (role IN ('super_admin', 'admin', 'it_volunteer'));

-- 2. Add columns for approval status, email, and mobile
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- 3. Security Helper Functions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND role = 'super_admin' AND (status = 'approved' OR status IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND (status = 'approved' OR status IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND (status = 'approved' OR status IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin Profiles Policies
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.admin_profiles;
CREATE POLICY "Users can read own profile"
    ON public.admin_profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.admin_profiles;
CREATE POLICY "Users can insert own profile"
    ON public.admin_profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
CREATE POLICY "Super admins can manage admin profiles"
    ON public.admin_profiles FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 5. Volunteers Policies:
-- Approved users (super_admin, admin, it_volunteer) can read, insert and update volunteers
-- ONLY super_admin and admin can delete volunteers!
DROP POLICY IF EXISTS "Admins can view all volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Approved users can view all volunteers" ON public.volunteers;
CREATE POLICY "Approved users can view all volunteers"
    ON public.volunteers FOR SELECT
    USING (public.is_approved_user());

DROP POLICY IF EXISTS "Admins can insert volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Approved users can insert volunteers" ON public.volunteers;
CREATE POLICY "Approved users can insert volunteers"
    ON public.volunteers FOR INSERT
    WITH CHECK (public.is_approved_user());

DROP POLICY IF EXISTS "Admins can update volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Approved users can update volunteers" ON public.volunteers;
CREATE POLICY "Approved users can update volunteers"
    ON public.volunteers FOR UPDATE
    USING (public.is_approved_user())
    WITH CHECK (public.is_approved_user());

DROP POLICY IF EXISTS "Admins can delete volunteers" ON public.volunteers;
DROP POLICY IF EXISTS "Only admins can delete volunteers" ON public.volunteers;
CREATE POLICY "Only admins can delete volunteers"
    ON public.volunteers FOR DELETE
    USING (public.is_admin());
