import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { CONFIG } from '@/lib/config';
import { db } from '@/lib/data/mock-db';
import { isAuthorizedAdminEmail } from '@/lib/auth/admin';
import { normalizeIndianPhoneNumber } from '@/lib/auth/phone';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, email, phone, password } = body;
    const rawIdentifier = (identifier || email || phone || '').trim();

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { error: 'Please enter your mobile number/email and password.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let targetEmail = '';
    let isPhone = false;
    let normalizedPhone = '';

    if (rawIdentifier.includes('@')) {
      targetEmail = rawIdentifier.toLowerCase().trim();
    } else {
      const phoneValidation = normalizeIndianPhoneNumber(rawIdentifier);
      if (phoneValidation.isValid) {
        isPhone = true;
        normalizedPhone = phoneValidation.e164;
        const national = phoneValidation.national;

        // 1. Try finding student's email from Supabase profiles table
        if (admin) {
          try {
            const { data: profileData } = await admin
              .from('profiles')
              .select('email, phone')
              .or(`phone.eq.${phoneValidation.e164},phone.eq.${phoneValidation.formatted},phone.eq.${national}`)
              .limit(1);

            if (profileData && profileData.length > 0 && profileData[0].email) {
              targetEmail = profileData[0].email;
            }
          } catch {
            // ignore
          }
        }

        // 2. Check Supabase auth users list for registered phone in metadata or synthetic email
        if (!targetEmail && admin) {
          try {
            const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
            const matchedUser = usersData?.users?.find((u) => {
              const uPhone = (u.phone || u.user_metadata?.phone || '').replace(/\D/g, '').slice(-10);
              const uEmail = (u.email || '').toLowerCase();
              return uPhone === national || uEmail === `${national}@phone.aspireacademyonline.in`;
            });
            if (matchedUser?.email) {
              targetEmail = matchedUser.email;
            }
          } catch {
            // ignore
          }
        }

        // 2. Check local mock-db profiles
        if (!targetEmail) {
          const localProfile = db.profiles.find((p) => {
            const pDigits = p.phone ? p.phone.replace(/\D/g, '').slice(-10) : '';
            return pDigits === national;
          });
          if (localProfile?.email) {
            targetEmail = localProfile.email;
          }
        }

        // 3. Fallback to synthetic phone email
        if (!targetEmail) {
          targetEmail = `${national}@phone.aspireacademyonline.in`;
        }
      } else {
        targetEmail = rawIdentifier.toLowerCase().trim();
      }
    }

    // Administrator accounts must sign in via Admin Portal
    if (isAuthorizedAdminEmail(targetEmail)) {
      return NextResponse.json(
        {
          error:
            'Administrator account detected. Authorized faculty and administrators must sign in through the Admin Portal at /admin/login.',
        },
        { status: 403 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      CONFIG.SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      CONFIG.SUPABASE_ANON_KEY;

    let authUser: any = null;
    let authSession: any = null;

    if (supabaseUrl && anonKey) {
      const supabase = createSupabaseClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      let authRes = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      // If phone login failed on primary targetEmail, try synthetic phone email if different
      if (authRes.error && isPhone && targetEmail.includes('@') && !targetEmail.includes('@phone.aspireacademyonline.in')) {
        const phoneValidation = normalizeIndianPhoneNumber(rawIdentifier);
        const synthEmail = `${phoneValidation.national}@phone.aspireacademyonline.in`;
        const retryRes = await supabase.auth.signInWithPassword({
          email: synthEmail,
          password,
        });
        if (!retryRes.error && retryRes.data.user) {
          authRes = retryRes;
          targetEmail = synthEmail;
        }
      }

      // If unconfirmed email, auto-confirm and retry
      if (authRes.error && authRes.error.message.toLowerCase().includes('not confirmed') && admin) {
        try {
          const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
          const userObj = usersData?.users?.find(
            (u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase()
          );
          if (userObj) {
            await admin.auth.admin.updateUserById(userObj.id, { email_confirm: true });
            authRes = await supabase.auth.signInWithPassword({
              email: targetEmail,
              password,
            });
          }
        } catch {
          // ignore
        }
      }

      if (!authRes.error && authRes.data.user) {
        authUser = authRes.data.user;
        authSession = authRes.data.session;
      }
    }

    // Fallback: Check Demo Student credentials in mock database
    if (!authUser) {
      const isDemoIdentifier =
        targetEmail === 'student@aspireacademy.demo' ||
        targetEmail === 'student.demo.test@aspireacademy.in' ||
        rawIdentifier.includes('9876543210') ||
        rawIdentifier.includes('98765 43210');

      const acceptedDemoPasswords = [
        'Password@123',
        'demo123',
        'student123',
        '123456',
        'aspire123',
        'aspire2026',
        'StudentDemoPassword2026',
        'Student@123',
        'Student2026',
        'aspire',
      ];

      if (isDemoIdentifier && acceptedDemoPasswords.includes(password.trim())) {
        const demoProfile = db.resolveOrCreateProfile({
          id: '00000000-0000-4000-8000-000000000001',
          email: 'student@aspireacademy.demo',
          phone: '+91 9876543210',
          fullName: 'Priyanshu Kumari',
        });

        const res = NextResponse.json({
          success: true,
          user: demoProfile,
          role: 'student',
          message: 'Signed in successfully as Demo Student.',
        });

        res.cookies.set('aspire_session_id', demoProfile.id, {
          path: '/',
          httpOnly: false,
          maxAge: 30 * 24 * 60 * 60,
          sameSite: 'lax',
        });

        return res;
      }

      // Check if user is registered with Google OAuth and lacks password
      if (admin && targetEmail) {
        try {
          const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
          const userObj = usersData?.users?.find(
            (u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase()
          );
          if (userObj) {
            const hasGoogle =
              userObj.app_metadata?.providers?.includes('google') ||
              userObj.identities?.some((i: any) => i.provider === 'google');
            const hasEmail = userObj.app_metadata?.providers?.includes('email');
            if (hasGoogle && !hasEmail) {
              return NextResponse.json(
                {
                  error:
                    'This account was created using Google. Please click "Continue with Google / Gmail" above to sign in.',
                },
                { status: 400 }
              );
            }
          }
        } catch {
          // ignore
        }
      }

      return NextResponse.json(
        {
          error:
            'Invalid login credentials. Please verify your mobile number / email and password.',
        },
        { status: 401 }
      );
    }

    const fullName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      (targetEmail.includes('@phone.')
        ? `Student (${normalizedPhone || targetEmail.split('@')[0]})`
        : targetEmail.split('@')[0]);

    const canonicalProfile = db.resolveOrCreateProfile({
      id: authUser.id,
      email: targetEmail,
      fullName,
      phone: authUser.phone || authUser.user_metadata?.phone || (isPhone ? normalizedPhone : undefined),
    });

    // Upsert profile in Supabase PostgreSQL
    if (admin) {
      try {
        await admin.from('profiles').upsert(
          {
            id: authUser.id,
            email: targetEmail,
            full_name: fullName,
            phone: authUser.phone || authUser.user_metadata?.phone || (isPhone ? normalizedPhone : undefined),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch {
        // ignore
      }
    }

    const response = NextResponse.json({
      success: true,
      user: canonicalProfile,
      session: authSession,
      role: 'student',
      message: 'Student authenticated successfully.',
    });

    response.cookies.set('aspire_session_id', canonicalProfile.id, {
      path: '/',
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Student login error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error processing student login.' },
      { status: 500 }
    );
  }
}

