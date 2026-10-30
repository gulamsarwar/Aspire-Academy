import { NextRequest, NextResponse } from 'next/server';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { db } from '@/lib/data/mock-db';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getSupabaseStorageDiagnostic,
  uploadThumbnailToSupabase,
} from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  return checkServerAdminAuth(req);
}

// GET: Check Supabase storage status
export async function GET() {
  const diagnostic = getSupabaseStorageDiagnostic();
  return NextResponse.json(diagnostic);
}

// POST: Upload course thumbnail to Supabase Storage or local fallback
export async function POST(req: NextRequest) {
  try {
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
