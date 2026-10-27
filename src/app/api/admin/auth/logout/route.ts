import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Administrator signed out successfully.',
  });

  // Clear admin session cookies
  response.cookies.set('aspire_admin_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set('aspire_admin_token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
