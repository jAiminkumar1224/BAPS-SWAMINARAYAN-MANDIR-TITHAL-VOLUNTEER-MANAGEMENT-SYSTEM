-- BAPS SWAMINARAYAN MANDIR TITHAL - VOLUNTEER ID CARD SYSTEM
-- Production Database Schema and Row Level Security Migration

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Seva Vibhag Table
CREATE TABLE IF NOT EXISTS public.seva_vibhag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Volunteers Table
CREATE TABLE IF NOT EXISTS public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    village_name TEXT NOT NULL,
    xetra_name TEXT NOT NULL,
    seva_vibhag_id UUID REFERENCES public.seva_vibhag(id) ON DELETE SET NULL,
    photo_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Admin Profiles Table (references auth.users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes for High Performance Search & Filters
CREATE INDEX IF NOT EXISTS idx_volunteers_volunteer_id ON public.volunteers(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_name ON public.volunteers(name);
CREATE INDEX IF NOT EXISTS idx_volunteers_mobile ON public.volunteers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_volunteers_village ON public.volunteers(village_name);
CREATE INDEX IF NOT EXISTS idx_volunteers_xetra ON public.volunteers(xetra_name);
CREATE INDEX IF NOT EXISTS idx_volunteers_vibhag ON public.volunteers(seva_vibhag_id);
CREATE INDEX IF NOT EXISTS idx_seva_vibhag_active ON public.seva_vibhag(is_active);

-- 6. Updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_volunteers_updated_at ON public.volunteers;
CREATE TRIGGER trigger_volunteers_updated_at
    BEFORE UPDATE ON public.volunteers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_seva_vibhag_updated_at ON public.seva_vibhag;
CREATE TRIGGER trigger_seva_vibhag_updated_at
    BEFORE UPDATE ON public.seva_vibhag
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Helper Function to Check Admin Role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Row Level Security Policies
ALTER TABLE public.seva_vibhag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Seva Vibhag Policies:
DROP POLICY IF EXISTS "Anyone authenticated or admin can read active vibhags" ON public.seva_vibhag;
CREATE POLICY "Anyone authenticated or admin can read active vibhags"
    ON public.seva_vibhag FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Only admins can manage seva vibhag" ON public.seva_vibhag;
CREATE POLICY "Only admins can manage seva vibhag"
    ON public.seva_vibhag FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Volunteers Policies:
DROP POLICY IF EXISTS "Admins can view all volunteers" ON public.volunteers;
CREATE POLICY "Admins can view all volunteers"
    ON public.volunteers FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert volunteers" ON public.volunteers;
CREATE POLICY "Admins can insert volunteers"
    ON public.volunteers FOR INSERT
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update volunteers" ON public.volunteers;
CREATE POLICY "Admins can update volunteers"
    ON public.volunteers FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete volunteers" ON public.volunteers;
CREATE POLICY "Admins can delete volunteers"
    ON public.volunteers FOR DELETE
    USING (public.is_admin());

-- Admin Profiles Policies:
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
    ON public.admin_profiles FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
CREATE POLICY "Super admins can manage admin profiles"
    ON public.admin_profiles FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Allow initial super admin profile self-registration when table is empty
DROP POLICY IF EXISTS "Initial super admin creation when empty" ON public.admin_profiles;
CREATE POLICY "Initial super admin creation when empty"
    ON public.admin_profiles FOR INSERT
    WITH CHECK (
        auth.uid() = id AND (
            NOT EXISTS (SELECT 1 FROM public.admin_profiles)
            OR public.is_super_admin()
        )
    );

-- 9. Secure Public QR Verification RPC (Hides Mobile Number)
CREATE OR REPLACE FUNCTION public.verify_volunteer(p_volunteer_id TEXT)
RETURNS TABLE (
    volunteer_id TEXT,
    name TEXT,
    village_name TEXT,
    xetra_name TEXT,
    seva_vibhag_name TEXT,
    photo_path TEXT,
    created_at TIMESTAMPTZ,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.volunteer_id,
        v.name,
        v.village_name,
        v.xetra_name,
        COALESCE(sv.name, 'સ્વયંસેવક દળ') AS seva_vibhag_name,
        v.photo_path,
        v.created_at,
        true AS is_valid
    FROM public.volunteers v
    LEFT JOIN public.seva_vibhag sv ON v.seva_vibhag_id = sv.id
    WHERE UPPER(TRIM(v.volunteer_id)) = UPPER(TRIM(p_volunteer_id))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant public execution of verify_volunteer
GRANT EXECUTE ON FUNCTION public.verify_volunteer(TEXT) TO anon, authenticated;

-- 10. Seed Initial Example Departments (Safe to rerun)
INSERT INTO public.seva_vibhag (name, is_active)
VALUES
    ('સ્વયંસેવક દળ', true),
    ('પાર્કિંગ સેવા', true),
    ('ભોજન સેવા', true),
    ('ઉતારા સેવા', true),
    ('વ્યવસ્થા સેવા', true),
    ('સ્વાગત સેવા', true),
    ('મહિલા સેવા', true),
    ('સભા સંચાલન', true),
    ('ડેકોરેશન વિભાગ', true),
    ('અન્નકૂટ વિભાગ', true),
    ('સભા વ્યવસ્થા', true),
    ('સ્ટેજ વ્યવસ્થા', true),
    ('ફૂલહાર વિભાગ', true),
    ('રસોડા વિભાગ', true)
ON CONFLICT (name) DO NOTHING;

-- 11. Supabase Storage Bucket Setup
-- Create the bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('volunteer-photos', 'volunteer-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for volunteer-photos bucket:
DROP POLICY IF EXISTS "Public can view volunteer photos" ON storage.objects;
CREATE POLICY "Public can view volunteer photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'volunteer-photos');

DROP POLICY IF EXISTS "Admins can upload volunteer photos" ON storage.objects;
CREATE POLICY "Admins can upload volunteer photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'volunteer-photos' AND (auth.role() = 'authenticated'));

DROP POLICY IF EXISTS "Admins can update volunteer photos" ON storage.objects;
CREATE POLICY "Admins can update volunteer photos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'volunteer-photos' AND (auth.role() = 'authenticated'));

DROP POLICY IF EXISTS "Admins can delete volunteer photos" ON storage.objects;
CREATE POLICY "Admins can delete volunteer photos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'volunteer-photos' AND (auth.role() = 'authenticated'));
