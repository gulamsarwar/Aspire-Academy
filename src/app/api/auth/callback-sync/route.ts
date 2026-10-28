import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/mock-db';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isAuthorizedAdminEmail,
  isAuthorizedAdminId,
  CANONICAL_ADMIN_ID,
  signAdminToken,
} from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, session } = body;

    if (!user || !user.id || !user.email) {
      return NextResponse.json(
        { error: 'Missing authenticated user payload.' },
        { status: 400 }
      );
    }

    const email = (user.email || '').trim().toLowerCase();
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      (email ? email.split('@')[0] : 'Google Student');
    const avatarUrl =
      user.user_metadata?.avatar_url || user.user_metadata?.picture;

    const isAdmin = isAuthorizedAdminEmail(email) || isAuthorizedAdminId(user.id);

    // Upsert student profile in Supabase PostgreSQL
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
      } catch (err) {
        console.warn('PostgreSQL profile upsert notice:', err);
      }
    }

    // Upsert student in local memory
    const canonicalProfile = db.resolveOrCreateProfile({
      id: isAdmin ? CANONICAL_ADMIN_ID : user.id,
      email,
      fullName: isAdmin ? 'Shekhar Sir (Admin)' : fullName,
      avatarUrl,
    });

    const destination = isAdmin ? '/admin' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      user: canonicalProfile,
      session,
      isAdmin,
      redirectUrl: destination,
    });

    // Set persistent session cookies with global root path
    response.cookies.set('aspire_session_id', canonicalProfile.id, {
      path: '/',
      httpOnly: false,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
    });

    if (isAdmin) {
      response.cookies.set('aspire_admin_session', canonicalProfile.id, {
        path: '/',
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      const adminToken = signAdminToken({
        id: canonicalProfile.id,
        email: canonicalProfile.email,
      });

      response.cookies.set('aspire_admin_token', adminToken, {
        path: '/',
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });
    }

    return response;
  } catch (err: any) {
    console.error('Callback sync error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to complete authentication sync.' },
      { status: 500 }
    );
  }
}

