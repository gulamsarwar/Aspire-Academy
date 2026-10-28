import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/data/mock-db';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedAdminEmail, isAuthorizedAdminId, CANONICAL_ADMIN_ID, signAdminToken } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

function getPublicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost')) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = req.headers.get('host');
  if (host && !host.includes('localhost')) {
    return `https://${host}`;
  }
  if (req.nextUrl.origin && !req.nextUrl.origin.includes('localhost')) {
    return req.nextUrl.origin;
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  if (host && host.includes('localhost')) {
    return `http://${host}`;
  }
  return 'https://aspire-academy.pages.dev';
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
          errorDescription || 'Authentication was cancelled or encountered an error.'
        )}`,
        publicOrigin
      )
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      '';
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      '';

    if (supabaseUrl && supabaseKey) {
      // Prepare response early so cookies are written directly to it
      const tempDestination = new URL(redirectPath, publicOrigin);
      const response = NextResponse.redirect(tempDestination);

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Server Component context
              }
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError && data.user) {
        const user = data.user;
        const email = (user.email || '').trim().toLowerCase();
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Google Student');
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

        // Check if user is an authorized admin
        const isAdmin = isAuthorizedAdminEmail(email) || isAuthorizedAdminId(user.id);

        // Sync or persist student profile to Supabase database
        const admin = createAdminClient();
        if (admin) {
          try {
            await admin.from('profiles').upsert(
              {
                id: user.id,
                email,
                full_name: isAdmin ? 'Shekhar Sir (Admin)' : fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

            await admin.from('user_roles').upsert(
              {
                user_id: user.id,
                role: isAdmin ? 'admin' : 'student',
              },
              { onConflict: 'user_id,role' }
            );
          } catch (syncErr) {
            console.warn('Could not sync authenticated profile to Supabase PostgreSQL:', syncErr);
          }
        }

        // Also sync to local memory for instant fallback availability
        const profile = db.resolveOrCreateProfile({
          id: isAdmin ? CANONICAL_ADMIN_ID : user.id,
          email,
          fullName: isAdmin ? 'Shekhar Sir (Admin)' : fullName,
          avatarUrl,
        });

        const targetDestination = isAdmin ? '/admin' : redirectPath;
        const finalRedirectUrl = new URL(targetDestination, publicOrigin);
        const finalResponse = NextResponse.redirect(finalRedirectUrl);

        // Copy all Supabase auth cookies over to the final response
        response.cookies.getAll().forEach((c) => {
          finalResponse.cookies.set(c.name, c.value);
        });

        // Set persistent application session cookies
        finalResponse.cookies.set('aspire_session_id', profile.id, {
          path: '/',
          httpOnly: false,
          maxAge: 30 * 24 * 60 * 60, // 30 days
          sameSite: 'lax',
        });

        if (isAdmin) {
          finalResponse.cookies.set('aspire_admin_session', profile.id, {
            path: '/',
            httpOnly: false,
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
          });
          try {
            const adminToken = signAdminToken({ id: profile.id, email: profile.email });
            finalResponse.cookies.set('aspire_admin_token', adminToken, {
              path: '/',
              httpOnly: false,
              maxAge: 7 * 24 * 60 * 60,
              sameSite: 'lax',
            });
          } catch {
            // ignore
          }
        }

        return finalResponse;
      } else {
        console.error('Failed to exchange code for session:', exchangeError);
        return NextResponse.redirect(
          new URL(
            `/auth/login?error=${encodeURIComponent(
              exchangeError?.message || 'Authentication failed to complete session exchange.'
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
