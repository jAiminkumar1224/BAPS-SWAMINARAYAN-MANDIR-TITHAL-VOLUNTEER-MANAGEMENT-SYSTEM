import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback dummy client for build-time safety if env vars are not yet configured
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://dummy-baps-project.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const getStoragePublicUrl = (path: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (!isSupabaseConfigured) {
    return path;
  }
  const { data } = supabase.storage.from('volunteer-photos').getPublicUrl(path);
  return data.publicUrl;
};
