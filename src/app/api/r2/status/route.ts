import { NextResponse } from 'next/server';
import { getR2Diagnostic } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostic = getR2Diagnostic();
  return NextResponse.json({
    isConfigured: diagnostic.isConfigured,
    missing: diagnostic.missing,
    bucketName: diagnostic.bucketName || null,
    hasPublicDomain: Boolean(diagnostic.publicDomain),
  });
}
