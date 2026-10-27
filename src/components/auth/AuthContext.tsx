'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRoleType } from '@/lib/types';
import {
  createClient,
  setRuntimeSupabaseConfig,
  getSupabaseClientDiagnostic,
} from '@/lib/supabase/client';
import { db } from '@/lib/data/mock-db';
import {
  isAuthorizedAdminEmail,
  isAuthorizedAdminId,
  CANONICAL_ADMIN_ID,
} from '@/lib/auth/admin';

interface AuthContextType {
  user: Profile | null;
  role: UserRoleType;
  isLoading: boolean;
  isAuthReady: boolean;
  loginAsStudent: () => void;
  setAdminSession: (adminProfile: Profile) => void;
  logout: () => Promise<void>;
  customLogin: (email: string, fullName: string, role: UserRoleType, phone?: string) => void;
  loginWithGoogle: (redirectPath?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ user: any; session: any }>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'student',
  isLoading: false,
  isAuthReady: false,
  loginAsStudent: () => {},
  setAdminSession: () => {},
  logout: async () => {},
  customLogin: () => {},
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => ({ user: null, session: null }),
  resetPassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRoleType>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Helper to ensure Supabase client is ready, checking runtime /api/auth/config if needed
  const ensureSupabaseClient = async () => {
    let client = createClient();
    if (!client && typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/config', { cache: 'no-store' });
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.configured && cfg.supabaseUrl && cfg.anonKey) {
            setRuntimeSupabaseConfig(cfg.supabaseUrl, cfg.anonKey);
            client = createClient();
          }
        }
      } catch {
        // network error, fallback
      }
    }
    return client;
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function restoreSession() {
      try {
        const supabase = await ensureSupabaseClient();

        if (supabase) {
          // Listen to live auth state changes from Supabase
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const email = (session.user.email || '').trim().toLowerCase();
              const isAdmin = isAuthorizedAdminEmail(email) || isAuthorizedAdminId(session.user.id);

              const canonical = db.resolveOrCreateProfile({
                id: isAdmin ? CANONICAL_ADMIN_ID : session.user.id,
                email,
                fullName:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.name ||
                  (isAdmin ? 'Shekhar Sir (Admin)' : email.split('@')[0] || 'Student'),
                phone: session.user.phone || session.user.user_metadata?.phone,
                avatarUrl: session.user.user_metadata?.avatar_url,
              });

              setUser(canonical);
              setRole(isAdmin ? 'admin' : 'student');
              localStorage.setItem('aspire_user', JSON.stringify(canonical));
              localStorage.setItem('aspire_role', isAdmin ? 'admin' : 'student');
              if (typeof document !== 'undefined') {
                document.cookie = `aspire_session_id=${canonical.id}; path=/; max-age=2592000; SameSite=Lax;`;
              }
            }
          });
          unsubscribe = () => subscription.unsubscribe();

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            const email = (session.user.email || '').trim().toLowerCase();
            const isAdmin = isAuthorizedAdminEmail(email) || isAuthorizedAdminId(session.user.id);

            const canonical = db.resolveOrCreateProfile({
              id: isAdmin ? CANONICAL_ADMIN_ID : session.user.id,
              email,
              fullName:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                (isAdmin ? 'Shekhar Sir (Admin)' : email.split('@')[0] || 'Student'),
              phone: session.user.phone || session.user.user_metadata?.phone,
              avatarUrl: session.user.user_metadata?.avatar_url,
            });

            setUser(canonical);
            setRole(isAdmin ? 'admin' : 'student');
            localStorage.setItem('aspire_user', JSON.stringify(canonical));
            localStorage.setItem('aspire_role', isAdmin ? 'admin' : 'student');
            if (typeof document !== 'undefined') {
              document.cookie = `aspire_session_id=${canonical.id}; path=/; max-age=2592000; SameSite=Lax;`;
            }
            setIsAuthReady(true);
            return;
          }
        }

        // 2. Check admin cookie session
        const cookies = typeof document !== 'undefined' ? document.cookie : '';
        const hasAdminCookie = cookies.includes('aspire_admin_session');

        if (hasAdminCookie) {
          const adminProfile = db.resolveOrCreateProfile({
            id: CANONICAL_ADMIN_ID,
            email: 'aspireacademyamba@gmail.com',
            fullName: 'Shekhar Sir (Admin)',
            phone: '+91 9123456789',
          });
          setUser(adminProfile);
          setRole('admin');
          localStorage.setItem('aspire_user', JSON.stringify(adminProfile));
          localStorage.setItem('aspire_role', 'admin');
          setIsAuthReady(true);
          return;
        }

        // 3. Restore saved user from localStorage with canonical verification
        const savedUser = localStorage.getItem('aspire_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          const canonical = db.resolveOrCreateProfile({
            id: parsed.id,
            email: parsed.email,
            phone: parsed.phone,
            fullName: parsed.full_name,
            avatarUrl: parsed.avatar_url,
          });

          const isUserAuthorizedAdmin =
            isAuthorizedAdminEmail(canonical.email) || isAuthorizedAdminId(canonical.id);
          const savedRole = localStorage.getItem('aspire_role') as UserRoleType;

          if (savedRole === 'admin' && (isUserAuthorizedAdmin || hasAdminCookie)) {
            setUser(canonical);
            setRole('admin');
          } else {
            setUser(canonical);
            setRole('student');
            localStorage.setItem('aspire_role', 'student');
          }
        }
      } catch (err) {
        console.warn('Session restoration notice:', err);
      } finally {
        setIsAuthReady(true);
      }
    }

    restoreSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginAsStudent = () => {
    const studentUser = db.resolveOrCreateProfile({
      id: '00000000-0000-4000-8000-000000000001',
      email: 'student@aspireacademy.demo',
      phone: '+91 9876543210',
      fullName: 'Priyanshu Kumari',
    });
    setUser(studentUser);
    setRole('student');
    localStorage.setItem('aspire_user', JSON.stringify(studentUser));
    localStorage.setItem('aspire_role', 'student');
    if (typeof document !== 'undefined') {
      document.cookie = `aspire_session_id=${studentUser.id}; path=/; max-age=2592000; SameSite=Lax;`;
    }
  };

  const setAdminSession = (adminProfile: Profile) => {
    setUser(adminProfile);
    setRole('admin');
    localStorage.setItem('aspire_user', JSON.stringify(adminProfile));
    localStorage.setItem('aspire_role', 'admin');
    if (typeof document !== 'undefined') {
      document.cookie = `aspire_admin_session=${adminProfile.id}; path=/; max-age=604800; SameSite=Lax;`;
    }
  };

  const customLogin = (email: string, fullName: string, newRole: UserRoleType, phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = isAuthorizedAdminEmail(cleanEmail);
    const effectiveRole: UserRoleType = newRole === 'admin' && isAdmin ? 'admin' : 'student';

    const profile = db.resolveOrCreateProfile({
      email: cleanEmail,
      fullName,
      phone,
    });

    setUser(profile);
    setRole(effectiveRole);
    localStorage.setItem('aspire_user', JSON.stringify(profile));
    localStorage.setItem('aspire_role', effectiveRole);

    if (typeof document !== 'undefined') {
      document.cookie = `aspire_session_id=${profile.id}; path=/; max-age=2592000; SameSite=Lax;`;
    }
  };

  // Official Google OAuth integration with Supabase
  const loginWithGoogle = async (redirectPath: string = '/dashboard') => {
    setIsLoading(true);
    try {
      const supabase = await ensureSupabaseClient();
      const diagnostic = getSupabaseClientDiagnostic();

      if (!supabase || !diagnostic.isConfigured) {
        const missing = diagnostic.missing.join(', ');
        throw new Error(
          `Supabase configuration missing in production environment: ${missing}. Please set ${missing} in Cloudflare Pages / hosting environment settings.`
        );
      }

      // Resolve dynamic public origin
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://aspire-academy.pages.dev';

      const redirectUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        if (error.message.includes('not enabled') || error.message.includes('Unsupported provider')) {
          throw new Error(
            'Google provider is not enabled in your Supabase project (bobymknzhwoyzayfamrt). Please open Supabase Dashboard > Authentication > Providers > Google, enable it, and configure your Google Client ID & Secret.'
          );
        }
        throw new Error(error.message || 'Google OAuth provider error');
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('Supabase did not return an OAuth authorization URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Official Supabase Email / Password Sign In
  const loginWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = await ensureSupabaseClient();

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Invalid email or password.');
        }

        if (data.user) {
          const isAdmin = isAuthorizedAdminEmail(cleanEmail) || isAuthorizedAdminId(data.user.id);
          const fullName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            cleanEmail.split('@')[0];

          const canonical = db.resolveOrCreateProfile({
            id: isAdmin ? CANONICAL_ADMIN_ID : data.user.id,
            email: cleanEmail,
            fullName,
            phone: data.user.phone || data.user.user_metadata?.phone,
          });

          setUser(canonical);
          setRole(isAdmin ? 'admin' : 'student');
          localStorage.setItem('aspire_user', JSON.stringify(canonical));
          localStorage.setItem('aspire_role', isAdmin ? 'admin' : 'student');
          if (typeof document !== 'undefined') {
            document.cookie = `aspire_session_id=${canonical.id}; path=/; max-age=2592000; SameSite=Lax;`;
          }
          return;
        }
      }

      // If Supabase not yet configured, provide helpful diagnostic
      const diagnostic = getSupabaseClientDiagnostic();
      throw new Error(
        `Supabase authentication not configured: missing ${diagnostic.missing.join(', ')}.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Official Supabase Student Registration
  const registerWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = await ensureSupabaseClient();

      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone ? phone.trim() : undefined,
            },
          },
        });

        if (error) {
          throw new Error(error.message || 'Failed to create student account.');
        }

        if (data.user) {
          const canonical = db.resolveOrCreateProfile({
            id: data.user.id,
            email: cleanEmail,
            fullName: fullName.trim(),
            phone: phone ? phone.trim() : undefined,
          });

          setUser(canonical);
          setRole('student');
          localStorage.setItem('aspire_user', JSON.stringify(canonical));
          localStorage.setItem('aspire_role', 'student');
          if (typeof document !== 'undefined') {
            document.cookie = `aspire_session_id=${canonical.id}; path=/; max-age=2592000; SameSite=Lax;`;
          }
        }

        return data;
      }

      const diagnostic = getSupabaseClientDiagnostic();
      throw new Error(
        `Supabase authentication not configured: missing ${diagnostic.missing.join(', ')}.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Official Password Reset
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = await ensureSupabaseClient();

      if (!supabase) {
        const diagnostic = getSupabaseClientDiagnostic();
        throw new Error(
          `Supabase is not configured: missing ${diagnostic.missing.join(', ')}.`
        );
      }

      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://aspire-academy.pages.dev';

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/auth/callback?redirect=/auth/update-password`,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send password reset email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Safe Logout: Clears Supabase session and client cookies
  const logout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }

    setUser(null);
    setRole('student');
    localStorage.removeItem('aspire_user');
    localStorage.removeItem('aspire_role');

    // Clear session cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'aspire_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'aspire_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAuthReady,
        loginAsStudent,
        setAdminSession,
        logout,
        customLogin,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
