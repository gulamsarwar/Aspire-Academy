import { NextRequest, NextResponse } from 'next/server';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { manualEnrollmentOverrideInDatabase } from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkServerAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, courseId, batchId, action, reason } = body;

    if (!studentId || !courseId || !batchId || !action || !reason) {
      return NextResponse.json({ error: 'Missing required override parameters.' }, { status: 400 });
    }

    if (reason.trim().length < 5) {
      return NextResponse.json({ error: 'A detailed reason of at least 5 characters is required for audit logs.' }, { status: 400 });
    }

    const success = await manualEnrollmentOverrideInDatabase({
      adminId: '5afc6ea6-cb57-4591-a477-e5e820e5066f', // Shekhar Sir
      studentId,
      courseId,
      batchId,
      action,
      reason,
    });

    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to apply access override.' }, { status: 500 });
  }
}
