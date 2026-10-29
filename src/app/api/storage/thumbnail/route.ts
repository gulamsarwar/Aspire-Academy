import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAuthorizedAdminId, verifyAdminRequest, verifyAdminToken } from '@/lib/auth/admin';
import {
  getSupabaseStorageDiagnostic,
  uploadThumbnailToSupabase,
} from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const verified = verifyAdminRequest(req);
  if (verified.isAuthorized) return true;

  const cookieStore = await cookies();
  const adminToken = cookieStore.get('aspire_admin_token')?.value;
  if (adminToken && verifyAdminToken(adminToken).valid) return true;

  const adminCookie = cookieStore.get('aspire_admin_session')?.value;
  const sessionCookie = cookieStore.get('aspire_session_id')?.value;

  const candidateId = adminCookie || sessionCookie;
  if (!candidateId) return false;

  return isAuthorizedAdminId(candidateId);
}

// GET: Check Supabase storage status
export async function GET() {
  const diagnostic = getSupabaseStorageDiagnostic();
  return NextResponse.json(diagnostic);
}

// POST: Upload course thumbnail to Supabase Storage
export async function POST(req: NextRequest) {
  try {
    const diagnostic = getSupabaseStorageDiagnostic();
    if (!diagnostic.isConfigured) {
      return NextResponse.json(
        {
          error: 'Supabase Cloud Storage is not configured on this server.',
          help: 'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
        },
        { status: 503 }
      );
    }

    const isAdmin = await checkAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative credentials required for thumbnail upload.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please attach an image file.' },
        { status: 400 }
      );
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid image type: ${file.type}. Please use JPG, PNG, WebP, or GIF.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadThumbnailToSupabase(buffer, file.name, file.type);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Failed to upload thumbnail to Supabase Storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      key: uploadResult.key,
      bucket: 'course-thumbnails',
      provider: 'supabase',
      size: file.size,
      contentType: file.type,
      originalName: file.name,
    });
  } catch (err: any) {
    console.error('Supabase thumbnail upload error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error uploading thumbnail' },
      { status: 500 }
    );
  }
}
