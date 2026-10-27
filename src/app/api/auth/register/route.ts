import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';
import { normalizeIndianPhoneNumber } from '@/lib/auth/phone';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'email', email, phone, password, fullName } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    let targetEmail = '';
    let formattedPhone: string | undefined = undefined;

    if (type === 'phone' || phone) {
      const normalized = normalizeIndianPhoneNumber(phone);
      if (!normalized.isValid) {
        return NextResponse.json({ error: normalized.error }, { status: 400 });
      }
      targetEmail = `${normalized.national}@phone.aspireacademyonline.in`;
      formattedPhone = normalized.e164;
    } else {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }
      targetEmail = email.trim().toLowerCase();
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Server authentication client unavailable.' },
        { status: 500 }
      );
    }

    // Create user in Supabase with pre-confirmed email so student can log in instantly
    const { data, error } = await admin.auth.admin.createUser({
      email: targetEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        phone: formattedPhone,
        is_phone_account: Boolean(type === 'phone' || phone),
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email/mobile already exists. Please log in.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;
    if (user) {
      // Upsert profile in Supabase PostgreSQL
      try {
        await admin.from('profiles').upsert(
          {
            id: user.id,
            email: targetEmail,
            full_name: fullName.trim(),
            phone: formattedPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Profile upsert warning:', err);
      }

      // Sync with in-memory DB
      db.resolveOrCreateProfile({
        id: user.id,
        email: targetEmail,
        fullName: fullName.trim(),
        phone: formattedPhone,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: targetEmail,
        fullName: fullName.trim(),
        phone: formattedPhone,
      },
      message: 'Account successfully created and confirmed.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
