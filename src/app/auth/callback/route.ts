import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/data/mock-db';
import { isAuthorizedAdminEmail, isAuthorizedAdminId, CANONICAL_ADMIN_ID } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

function getPublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = req.headers.get('host');
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://aspire-academy-pi.vercel.app';
}

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const publicOrigin = getPublicOrigin(req);
  const code = requestUrl.searchParams.get('code');
  const redirectPath = requestUrl.searchParams.get('redirect') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    console.error('OAuth Callback Error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(
          errorDescription || 'Google authentication was cancelled or encountered an error.'
        )}`,
        publicOrigin
      )
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      '';

    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore in server component context
            }
          },
        },
      });

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError && data.user) {
        const user = data.user;
        const email = user.email || '';
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          email.split('@')[0] ||
          'Google Student';
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        // Check if user is an authorized admin
        const isAdmin = isAuthorizedAdminEmail(email) || isAuthorizedAdminId(user.id);

        // Resolve or create persistent canonical student/admin profile
        const profile = db.resolveOrCreateProfile({
          id: isAdmin ? CANONICAL_ADMIN_ID : user.id,
          email,
          fullName: isAdmin ? 'Shekhar Sir (Admin)' : fullName,
          avatarUrl,
        });

        const targetDestination = isAdmin ? '/admin' : redirectPath;
        const response = NextResponse.redirect(new URL(targetDestination, publicOrigin));

        // Set persistent session cookies
        response.cookies.set('aspire_session_id', profile.id, {
          path: '/',
          httpOnly: false,
          maxAge: 30 * 24 * 60 * 60, // 30 days
          sameSite: 'lax',
        });

        if (isAdmin) {
          response.cookies.set('aspire_admin_session', profile.id, {
            path: '/',
            httpOnly: false,
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
          });
        }

        return response;
      } else {
        console.error('Failed to exchange code for session:', exchangeError);
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent(
              exchangeError?.message || 'Google OAuth failed to exchange code for session.'
            )}`,
            publicOrigin
          )
        );
      }
    }
  }

  // If no code was provided in callback
  return NextResponse.redirect(
    new URL(
      `/auth/login?error=${encodeURIComponent('No authorization code provided in Google callback.')}`,
      publicOrigin
    )
  );
}
