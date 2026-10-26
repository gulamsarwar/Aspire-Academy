'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRoleType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { db, normalizeStudentId } from '@/lib/data/mock-db';
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
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRoleType>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        // 1. Check active Supabase cloud session first
        const supabase = createClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const isAdmin =
              isAuthorizedAdminEmail(session.user.email) ||
              isAuthorizedAdminId(session.user.id);

            const canonical = db.resolveOrCreateProfile({
              id: isAdmin ? CANONICAL_ADMIN_ID : session.user.id,
              email: session.user.email,
              fullName:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                (isAdmin ? 'Shekhar Sir (Admin)' : session.user.email?.split('@')[0]),
              phone: session.user.phone,
              avatarUrl: session.user.user_metadata?.avatar_url,
            });

            setUser(canonical);
            setRole(isAdmin ? 'admin' : 'student');
            localStorage.setItem('aspire_user', JSON.stringify(canonical));
            localStorage.setItem('aspire_role', isAdmin ? 'admin' : 'student');
            setIsAuthReady(true);
            return;
          }
        }

        // 2. Check admin cookie session
        const cookies = typeof document !== 'undefined' ? document.cookie : '';
        const hasAdminCookie = cookies.includes('aspire_admin_session');

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
            isAuthorizedAdminEmail(canonical.email) ||
            isAuthorizedAdminId(canonical.id);

          const savedRole = localStorage.getItem('aspire_role') as UserRoleType;

          // Strictly enforce allowlist: NEVER grant admin role if not authorized
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
  };

  const setAdminSession = (adminProfile: Profile) => {
    setUser(adminProfile);
    setRole('admin');
    localStorage.setItem('aspire_user', JSON.stringify(adminProfile));
    localStorage.setItem('aspire_role', 'admin');
  };

  const customLogin = (email: string, fullName: string, newRole: UserRoleType, phone?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = isAuthorizedAdminEmail(cleanEmail);

    // If student tries to declare themselves admin without being on the allowlist, deny
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

    // Sync cookie
    if (typeof document !== 'undefined') {
      document.cookie = `aspire_session_id=${profile.id}; path=/; max-age=2592000; SameSite=Lax;`;
    }
  };

  // Real Google OAuth integration with Supabase
  const loginWithGoogle = async (redirectPath: string = '/dashboard') => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (supabase) {
        // Resolve dynamic public origin (supports localhost, vercel preview, and custom domain)
        const origin =
          typeof window !== 'undefined' && window.location.origin
            ? window.location.origin
            : 'https://aspire-academy-pi.vercel.app';

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
          throw new Error(error.message || 'Google OAuth provider error');
        }

        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      throw new Error(
        'Google OAuth requires Supabase authentication configuration. Please verify NEXT_PUBLIC_SUPABASE_URL and Google Provider settings in Supabase Dashboard.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Safe Logout: Clears session credentials without deleting persistent database records
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
