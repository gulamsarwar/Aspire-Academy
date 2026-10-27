import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest, CANONICAL_ADMIN_ID } from '@/lib/auth/admin';
import { db } from '@/lib/data/mock-db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const check = verifyAdminRequest(req);

  if (!check.isAuthorized || !check.email) {
    return NextResponse.json(
      { authorized: false, error: 'Unauthorized administrator access.' },
      { status: 401 }
    );
  }

  const adminProfile = db.resolveOrCreateProfile({
    id: check.id || CANONICAL_ADMIN_ID,
    email: check.email,
    fullName: 'Shekhar Sir (Admin)',
    phone: '+91 9123456789',
  });

  return NextResponse.json({
    authorized: true,
    user: adminProfile,
    role: 'admin',
  });
}
