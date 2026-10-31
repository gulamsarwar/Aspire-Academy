import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  return checkServerAdminAuth(req);
}

export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative credentials required.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customTitle = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // 50MB size limit
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || '.pdf';
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFileName = `${baseName}-${crypto.randomUUID().slice(0, 6)}${ext}`;

    let writtenToDisk = false;
    // 1. Try ensuring public/notes directory exists on local disk (e.g. self-hosted / VPS)
    try {
      const notesDir = path.join(process.cwd(), 'public', 'notes');
      if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir, { recursive: true });
      }
      const targetFilePath = path.join(notesDir, uniqueFileName);
      fs.writeFileSync(targetFilePath, buffer);
      writtenToDisk = true;
    } catch (diskErr) {
      console.warn('Local disk write skipped (read-only or serverless environment):', diskErr);
    }

    const publicPath = `/notes/${uniqueFileName}`;
    let finalUrl = publicPath;

    // 2. If Supabase Storage is configured, upload to bucket
    const admin = createAdminClient();
    if (admin) {
      try {
        let uploadRes = await admin.storage.from('course-notes').upload(uniqueFileName, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: true,
        });

        // If bucket does not exist, auto-create it
        if (uploadRes.error && (uploadRes.error.message?.includes('not found') || uploadRes.error.message?.includes('Bucket'))) {
          await admin.storage.createBucket('course-notes', { public: true }).catch(() => null);
          uploadRes = await admin.storage.from('course-notes').upload(uniqueFileName, buffer, {
            contentType: file.type || 'application/pdf',
            upsert: true,
          });
        }

        if (!uploadRes.error) {
          const { data: pubUrl } = admin.storage.from('course-notes').getPublicUrl(uniqueFileName);
          if (pubUrl?.publicUrl) {
            finalUrl = pubUrl.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Supabase storage upload error:', storageErr);
      }
    }

    if (!writtenToDisk && finalUrl === publicPath) {
      if (buffer.length < 5 * 1024 * 1024) {
        finalUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
      } else {
        return NextResponse.json(
          { error: 'Storage unavailable. Please configure Supabase Storage or writable disk.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      material_path: finalUrl,
      material_name: customTitle?.trim() || file.name.replace(/\.[^/.]+$/, ''),
      file_name: uniqueFileName,
      size: file.size,
      contentType: file.type || 'application/pdf',
    });
  } catch (err: any) {
    console.error('Note upload error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upload note.' }, { status: 500 });
  }
}

