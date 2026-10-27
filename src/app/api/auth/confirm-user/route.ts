import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: 'Admin client unavailable.' }, { status: 500 });
    }

    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetUser = data.users.find((u) => (u.email || '').toLowerCase() === cleanEmail);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!targetUser.email_confirmed_at) {
      await admin.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
    }

    return NextResponse.json({ success: true, message: 'User email confirmed successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Confirmation error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
