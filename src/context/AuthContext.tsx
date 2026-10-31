import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AdminProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      // Local fallback profile
      setProfile({
        id: userId,
        full_name: 'BAPS Tithal Admin',
        role: 'super_admin',
        created_at: new Date().toISOString(),
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as AdminProfile);
      } else {
        // If profile doesn't exist, check if table is empty to assign super_admin
        const { count } = await supabase
          .from('admin_profiles')
          .select('*', { count: 'exact', head: true });

        if (count === 0) {
          const newProfile: AdminProfile = {
            id: userId,
            full_name: 'Super Admin (Tithal)',
            role: 'super_admin',
            created_at: new Date().toISOString(),
          };
          await supabase.from('admin_profiles').insert(newProfile);
          setProfile(newProfile);
        } else {
          setProfile(null);
        }
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Check local storage session for development/demo testing
      const savedUser = localStorage.getItem('baps_mock_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setProfile({
            id: parsed.id,
            full_name: 'BAPS Tithal Admin',
            role: 'super_admin',
            created_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Offline fallback login for demo/testing before Supabase is connected
      const mockUser = {
        id: 'mock-admin-id',
        email,
        app_metadata: {},
        user_metadata: { full_name: 'BAPS Tithal Admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      localStorage.setItem('baps_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        full_name: 'BAPS Tithal Admin',
        role: 'super_admin',
        created_at: new Date().toISOString(),
      });
      return { error: null };
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      await fetchProfile(data.user.id);
    }
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem('baps_mock_user');
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
    }
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = Boolean(profile && (profile.role === 'admin' || profile.role === 'super_admin'));
  const isSuperAdmin = Boolean(profile && profile.role === 'super_admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isSuperAdmin,
        loading,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
