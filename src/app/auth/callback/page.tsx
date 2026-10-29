'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Verifying Google credentials...');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function processAuth() {
      try {
        // If this callback was bridged from a local network device (e.g. mobile testing at 192.168.x.x),
        // forward the complete URL (query parameters + hash fragment with tokens) back to the local device!
        const returnTo = searchParams.get('return_to');
        if (typeof window !== 'undefined' && returnTo && !returnTo.includes(window.location.host)) {
          try {
            const target = new URL('/auth/callback', returnTo);
            searchParams.forEach((val, key) => {
              if (key !== 'return_to') target.searchParams.set(key, val);
            });
            target.hash = window.location.hash;
            window.location.replace(target.toString());
            return;
          } catch (bridgeErr) {
            console.warn('Bridge return_to notice:', bridgeErr);
          }
        }

        // 1. Check for URL query error parameters
        const urlError = searchParams.get('error') || searchParams.get('error_description');
        if (urlError) {
          throw new Error(decodeURIComponent(urlError));
        }

        const redirectTarget = searchParams.get('redirect') || '/dashboard';
        const supabase = createClient();

        if (!supabase) {
          throw new Error('Supabase client could not be initialized.');
        }

        // Helper to complete server sync and redirect
        const finishLogin = async (user: any, session: any) => {
          if (isCancelled) return;
          setStatusMessage('Setting up your student dashboard & courses...');

          try {
            const syncRes = await fetch('/api/auth/callback-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user, session }),
            });

            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.user) {
                localStorage.setItem('aspire_user', JSON.stringify(syncData.user));
                localStorage.setItem(
                  'aspire_role',
                  syncData.isAdmin ? 'admin' : 'student'
                );
                document.cookie = `aspire_session_id=${syncData.user.id}; path=/; max-age=2592000; SameSite=Lax;`;

                const dest = syncData.isAdmin ? '/admin' : redirectTarget;
                router.replace(dest);
                return;
              }
            }
          } catch (syncErr) {
            console.warn('Sync server notice:', syncErr);
          }

          // Fallback direct storage & navigation
          localStorage.setItem(
            'aspire_user',
            JSON.stringify({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
            })
          );
          localStorage.setItem('aspire_role', 'student');
          document.cookie = `aspire_session_id=${user.id}; path=/; max-age=2592000; SameSite=Lax;`;

          router.replace(redirectTarget);
        };

        // 2. Check for PKCE Authorization Code in query params (?code=...)
        const code = searchParams.get('code');
        if (code) {
          setStatusMessage('Exchanging authorization code...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data.user) {
            await finishLogin(data.user, data.session);
            return;
          }
          if (error) {
            console.warn('PKCE code exchange notice:', error.message);
          }
        }

        // 3. Check for Implicit Flow hash fragments (#access_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashString = window.location.hash.startsWith('#')
            ? window.location.hash.slice(1)
            : window.location.hash;

          const hashParams = new URLSearchParams(hashString);
          const hashError = hashParams.get('error_description') || hashParams.get('error');
          if (hashError) {
            throw new Error(decodeURIComponent(hashError));
          }

          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            setStatusMessage('Validating access token...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error && data.user) {
              await finishLogin(data.user, data.session);
              return;
            }
          }
        }

        // 4. Check existing or auto-hydrated session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          await finishLogin(sessionData.session.user, sessionData.session);
          return;
        }

        // 5. Listen for auth state change event
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            subscription.unsubscribe();
            await finishLogin(session.user, session);
          }
        });

        // 6. Grace period timeout before failing
        setTimeout(async () => {
          if (isCancelled) return;
          const { data: finalCheck } = await supabase.auth.getSession();
          if (finalCheck?.session?.user) {
            await finishLogin(finalCheck.session.user, finalCheck.session);
          } else {
            setErrorMessage(
              'Google authentication could not be completed. Please return to the login page and try again.'
            );
          }
        }, 4000);
      } catch (err: any) {
        if (!isCancelled) {
          console.error('OAuth Callback processing error:', err);
          setErrorMessage(
            err?.message ||
              'Unable to complete Google sign-in. Please try again or use Mobile/Email login.'
          );
        }
      }
    }

    processAuth();

    return () => {
      isCancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <BrandLogo variant="dark" size="lg" />

        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 space-y-6">
          {errorMessage ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 text-left">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-red-900">Sign-in Verification Error</p>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              <Link
                href="/auth/login"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-md flex items-center justify-center gap-2"
              >
                <span>Return to Student Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="py-6 space-y-4 text-center">
              <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#046BD2] animate-spin" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  Signing in with Google
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {statusMessage}
                </p>
              </div>

              <div className="pt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-semibold text-[#046BD2]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Aspire Academy • Academic Session 2026-27</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

