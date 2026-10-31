import { NextRequest, NextResponse } from 'next/server';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { getAuditLogsFromDatabase } from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await checkServerAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const logs = await getAuditLogsFromDatabase(25);
    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch audit logs.' }, { status: 500 });
  }
}

