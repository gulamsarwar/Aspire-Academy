import { NextRequest, NextResponse } from 'next/server';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { db } from '@/lib/data/mock-db';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getR2Diagnostic,
  createPresignedUploadUrl,
  uploadToR2ServerSide,
} from '@/lib/r2';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  return checkServerAdminAuth(req);
}

export async function POST(req: NextRequest) {
  try {
    const diagnostic = getR2Diagnostic();
    if (!diagnostic.isConfigured) {
      return NextResponse.json(
        {
          error: 'Cloudflare R2 is not configured on this server.',
          missing: diagnostic.missing,
          help: 'Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in environment settings.',
        },
        { status: 503 }
      );
    }

    const isAdmin = await checkAdminAuth(req);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative credentials required for media uploads.' },
        { status: 403 }
      );
    }

    const contentTypeHeader = req.headers.get('content-type') || '';

    // Mode 1: Presigned URL Request (JSON payload)
    if (contentTypeHeader.includes('application/json')) {
      const body = await req.json();
      const { filename, contentType, type = 'thumbnail', resourceId = 'general' } = body;

      if (!filename || !contentType) {
        return NextResponse.json(
          { error: 'Filename and contentType are required.' },
          { status: 400 }
        );
      }

      // Validate media types
      if (type === 'thumbnail') {
        const validImages = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validImages.includes(contentType.toLowerCase())) {
          return NextResponse.json(
            { error: 'Invalid thumbnail format. Supported: JPG, PNG, WebP, GIF.' },
            { status: 400 }
          );
        }
      } else if (type === 'video') {
        const validVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
        if (!validVideos.includes(contentType.toLowerCase())) {
          return NextResponse.json(
            { error: 'Invalid video format. Supported: MP4, WebM, MOV.' },
            { status: 400 }
          );
        }
      }

      const ext = filename.split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
      const sanitizedResourceId = String(resourceId).replace(/[^a-zA-Z0-9_-]/g, '');
      const key = `${type}s/${sanitizedResourceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { uploadUrl } = await createPresignedUploadUrl({
        key,
        contentType,
        expiresInSeconds: 1800, // 30 minutes for large videos
      });

      return NextResponse.json({
        success: true,
        uploadUrl,
        key,
        type,
      });
    }

    // Mode 2: Direct Multipart Form Upload (Ideal for thumbnails / images)
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const type = (formData.get('type') as string) || 'thumbnail';
      const resourceId = (formData.get('resourceId') as string) || 'general';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      // Max sizes: Thumbnail 10MB, Direct Video 100MB (use presigned for larger)
      const maxBytes = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        return NextResponse.json(
          { error: `File exceeds maximum allowed size (${type === 'video' ? '100MB' : '10MB'}).` },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
      const sanitizedResourceId = String(resourceId).replace(/[^a-zA-Z0-9_-]/g, '');
      const key = `${type}s/${sanitizedResourceId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadToR2ServerSide({
        key,
        buffer,
        contentType: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
      });

      return NextResponse.json({
        success: true,
        key: result.key,
        publicUrl: result.publicUrl,
        fileUrl: `/api/r2/playback?key=${encodeURIComponent(result.key)}`,
      });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type.' }, { status: 400 });
  } catch (error: any) {
    console.error('R2 upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process R2 upload.' },
      { status: 500 }
    );
  }
}
