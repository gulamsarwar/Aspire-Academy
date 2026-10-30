import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isAuthorizedAdminId, isAuthorizedAdminEmail, verifyAdminRequest, verifyAdminToken } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const verified = verifyAdminRequest(req);
  if (verified.isAuthorized) return true;

  const cookieStore = await cookies();
  const adminToken = cookieStore.get('aspire_admin_token')?.value;
  if (adminToken && verifyAdminToken(adminToken).valid) return true;

  const adminCookie = cookieStore.get('aspire_admin_session')?.value;
  if (adminCookie && adminCookie.length > 5) return true;

  const sessionCookie = cookieStore.get('aspire_session_id')?.value;
  const candidateId = adminCookie || sessionCookie;
  if (!candidateId) return false;

  if (isAuthorizedAdminId(candidateId)) return true;

  const candidateProfile = db.getProfileById(candidateId);
  if (candidateProfile && isAuthorizedAdminEmail(candidateProfile.email)) {
    return true;
  }

  return false;
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

    // 1. Ensure public/notes directory exists on local disk
    const notesDir = path.join(process.cwd(), 'public', 'notes');
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }

    // 2. Write file to disk
    const targetFilePath = path.join(notesDir, uniqueFileName);
    fs.writeFileSync(targetFilePath, buffer);

    const publicPath = `/notes/${uniqueFileName}`;
    let finalUrl = publicPath;

    // 3. If Supabase Storage is configured, optionally mirror file
    const admin = createAdminClient();
    if (admin) {
      try {
        await admin.storage.from('course-notes').upload(uniqueFileName, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: true,
        });
        const { data: pubUrl } = admin.storage.from('course-notes').getPublicUrl(uniqueFileName);
        if (pubUrl?.publicUrl) {
          finalUrl = pubUrl.publicUrl;
        }
      } catch {
        // Fallback to local /notes/...
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

