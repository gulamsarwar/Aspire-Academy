import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminCredentials } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, identifier, password } = body;
    const adminIdentifier = (identifier || username || email || '').trim();

    if (!adminIdentifier || !password) {
      return NextResponse.json(
        { error: 'Username/Email and administrator password are required.' },
        { status: 400 }
      );
    }

    const authResult = authenticateAdminCredentials(adminIdentifier, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid administrator credentials.' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: authResult.user,
      token: authResult.token,
      role: 'admin',
      message: 'Administrator session authenticated successfully.',
    });

    // Set cryptographically signed admin token cookie
    if (authResult.token) {
      response.cookies.set('aspire_admin_token', authResult.token, {
        path: '/',
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        sameSite: 'lax',
      });
    }

    // Set secure admin session cookie
    response.cookies.set('aspire_admin_session', authResult.user.id, {
      path: '/',
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { error: 'Internal error processing administrator authentication.' },
      { status: 500 }
    );
  }
}
