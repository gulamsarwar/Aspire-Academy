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
import {
  normalizeIndianPhoneNumber,
  formatSupabasePhoneError,
} from '@/lib/auth/phone';

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
  // Mobile Phone Authentication
  loginWithPhonePassword: (phone: string, password: string) => Promise<void>;
  sendPhoneOtp: (phone: string, shouldCreateUser?: boolean) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  registerWithPhonePassword: (
    phone: string,
    password: string,
    fullName: string
  ) => Promise<{ user: any; session: any }>;
  resetPasswordWithPhoneOtp: (
    phone: string,
    token: string,
    newPassword: string
  ) => Promise<void>;
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
  loginWithPhonePassword: async () => {},
  sendPhoneOtp: async () => {},
  verifyPhoneOtp: async () => {},
  registerWithPhonePassword: async () => ({ user: null, session: null }),
  resetPasswordWithPhoneOtp: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aspire_user');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRoleType>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRole = localStorage.getItem('aspire_role');
        if (savedRole === 'admin') return 'admin';
      } catch {
        // ignore
      }
    }
    return 'student';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('aspire_user');
    }
    return false;
  });

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
    setIsAuthReady(true);
    localStorage.setItem('aspire_user', JSON.stringify(studentUser));
    localStorage.setItem('aspire_role', 'student');
    if (typeof document !== 'undefined') {
      document.cookie = `aspire_session_id=${studentUser.id}; path=/; max-age=2592000; SameSite=Lax;`;
    }
  };

  const setAdminSession = (adminProfile: Profile) => {
    setUser(adminProfile);
    setRole('admin');
    setIsAuthReady(true);
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
    setIsAuthReady(true);
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
          `Supabase configuration missing in production environment: ${missing}.`
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
            'Google OAuth Provider Supabase mein Enable nahi hai. Original Google Login chalu karne ke liye Supabase Dashboard > Authentication > Providers > Google mein Google Client ID aur Secret dalein.'
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

      // 1. Authenticate via secure server-side endpoint
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: cleanEmail, password }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          setRole('student');
          localStorage.setItem('aspire_user', JSON.stringify(data.user));
          localStorage.setItem('aspire_role', 'student');
          if (typeof document !== 'undefined') {
            document.cookie = `aspire_session_id=${data.user.id}; path=/; max-age=2592000; SameSite=Lax;`;
          }

          if (data.session) {
            try {
              const supabase = await ensureSupabaseClient();
              if (supabase) {
                await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                });
              }
            } catch {
              // ignore
            }
          }
          return;
        }

        if (!res.ok && data.error) {
          throw new Error(data.error);
        }
      } catch (apiErr: any) {
        if (apiErr?.message && !apiErr.message.includes('fetch')) {
          throw apiErr;
        }
      }

      // 2. Client-side SDK fallback
      const supabase = await ensureSupabaseClient();
      if (supabase) {
        let authRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        // Automatically auto-confirm unconfirmed emails so students are never blocked
        if (authRes.error && authRes.error.message.toLowerCase().includes('not confirmed')) {
          try {
            await fetch('/api/auth/confirm-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail }),
            });
            // Retry login immediately after confirmation
            authRes = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
          } catch {
            // ignore fallback
          }
        }

        if (authRes.error) {
          throw new Error(authRes.error.message || 'Invalid email or password.');
        }

        if (authRes.data.user) {
          const user = authRes.data.user;
          const isAdmin = isAuthorizedAdminEmail(cleanEmail) || isAuthorizedAdminId(user.id);
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            cleanEmail.split('@')[0];

          const canonical = db.resolveOrCreateProfile({
            id: isAdmin ? CANONICAL_ADMIN_ID : user.id,
            email: cleanEmail,
            fullName,
            phone: user.phone || user.user_metadata?.phone,
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

      const diagnostic = getSupabaseClientDiagnostic();
      throw new Error(
        `Supabase authentication not configured: missing ${diagnostic.missing.join(', ')}.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Official Supabase Student Registration with Instant Auto-Confirmation
  const registerWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Register via server-side endpoint which pre-confirms the email in Supabase
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          email: cleanEmail,
          password,
          fullName: fullName.trim(),
          phone: phone ? phone.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student account.');
      }

      // Log in immediately
      await loginWithEmail(cleanEmail, password);
      return data;
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

  // 1. Mobile Phone + Password Login with Resilient Fallback
  const loginWithPhonePassword = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const { isValid, e164, error: phoneError, national } = normalizeIndianPhoneNumber(phone);
      if (!isValid) throw new Error(phoneError);

      if (!password) throw new Error('Please enter your account password.');

      // 1. Authenticate via secure server-side endpoint (auto resolves phone to registered profile)
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: e164, password }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.user) {
          setUser(data.user);
          setRole('student');
          localStorage.setItem('aspire_user', JSON.stringify(data.user));
          localStorage.setItem('aspire_role', 'student');
          if (typeof document !== 'undefined') {
            document.cookie = `aspire_session_id=${data.user.id}; path=/; max-age=2592000; SameSite=Lax;`;
          }

          if (data.session) {
            try {
              const supabase = await ensureSupabaseClient();
              if (supabase) {
                await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                });
              }
            } catch {
              // ignore
            }
          }
          return;
        }

        if (!res.ok && data.error) {
          throw new Error(data.error);
        }
      } catch (apiErr: any) {
        if (apiErr?.message && !apiErr.message.includes('fetch')) {
          throw apiErr;
        }
      }

      // 2. Client-side SDK fallback
      const supabase = await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized.');

      const phoneEmail = `${national}@phone.aspireacademyonline.in`;

      let authRes = await supabase.auth.signInWithPassword({
        phone: e164,
        password,
      });

      if (
        authRes.error &&
        (authRes.error.message.includes('disabled') ||
          authRes.error.message.includes('Unsupported') ||
          authRes.error.message.includes('Invalid login credentials'))
      ) {
        // Fall back to phone-derived verified email account
        authRes = await supabase.auth.signInWithPassword({
          email: phoneEmail,
          password,
        });
      }

      if (authRes.error) {
        throw new Error(authRes.error.message || 'Invalid mobile number or password.');
      }

      if (authRes.data.user) {
        const user = authRes.data.user;
        const canonical = db.resolveOrCreateProfile({
          id: user.id,
          phone: e164,
          fullName: user.user_metadata?.full_name || 'Aspire Student',
        });
        setUser(canonical);
        setRole('student');
        localStorage.setItem('aspire_user', JSON.stringify(canonical));
        localStorage.setItem('aspire_role', 'student');
        if (typeof document !== 'undefined') {
          document.cookie = `aspire_session_id=${canonical.id}; path=/; max-age=2592000; SameSite=Lax;`;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Send SMS OTP via Supabase Auth
  const sendPhoneOtp = async (phone: string, shouldCreateUser: boolean = false) => {
    setIsLoading(true);
    try {
      const { isValid, e164, error: phoneError } = normalizeIndianPhoneNumber(phone);
      if (!isValid) throw new Error(phoneError);

      const supabase = await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized.');

      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: {
          shouldCreateUser,
        },
      });

      if (error) throw new Error(formatSupabasePhoneError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify SMS OTP via Supabase Auth
  const verifyPhoneOtp = async (phone: string, token: string) => {
    setIsLoading(true);
    try {
      const { isValid, e164, error: phoneError } = normalizeIndianPhoneNumber(phone);
      if (!isValid) throw new Error(phoneError);

      const cleanToken = token.trim().replace(/\D/g, '');
      if (cleanToken.length !== 6) throw new Error('Please enter the 6-digit OTP code.');

      const supabase = await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized.');

      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164,
        token: cleanToken,
        type: 'sms',
      });

      if (error) throw new Error(formatSupabasePhoneError(error));

      if (data.user) {
        const canonical = db.resolveOrCreateProfile({
          id: data.user.id,
          phone: e164,
          fullName: data.user.user_metadata?.full_name || 'Aspire Student',
        });
        setUser(canonical);
        setRole('student');
        localStorage.setItem('aspire_user', JSON.stringify(canonical));
        localStorage.setItem('aspire_role', 'student');
        if (typeof document !== 'undefined') {
          document.cookie = `aspire_session_id=${canonical.id}; path=/; max-age=2592000; SameSite=Lax;`;
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Register with Phone + Password with Instant Auto-Confirmation
  const registerWithPhonePassword = async (phone: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { isValid, e164, error: phoneError } = normalizeIndianPhoneNumber(phone);
      if (!isValid) throw new Error(phoneError);

      if (!fullName.trim()) throw new Error('Please enter your full name.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phone',
          phone: e164,
          password,
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student account.');
      }

      // Log in immediately
      await loginWithPhonePassword(phone, password);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Reset Password using Phone OTP
  const resetPasswordWithPhoneOtp = async (phone: string, token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const { isValid, e164, error: phoneError } = normalizeIndianPhoneNumber(phone);
      if (!isValid) throw new Error(phoneError);

      const cleanToken = token.trim().replace(/\D/g, '');
      if (cleanToken.length !== 6) throw new Error('Please enter the 6-digit OTP code.');
      if (newPassword.length < 6) throw new Error('New password must be at least 6 characters.');

      const supabase = await ensureSupabaseClient();
      if (!supabase) throw new Error('Supabase client not initialized.');

      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164,
        token: cleanToken,
        type: 'sms',
      });

      if (error) throw new Error(formatSupabasePhoneError(error));

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw new Error(updateError.message || 'Failed to update password.');
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
      document.cookie = 'aspire_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
        loginWithPhonePassword,
        sendPhoneOtp,
        verifyPhoneOtp,
        registerWithPhonePassword,
        resetPasswordWithPhoneOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
