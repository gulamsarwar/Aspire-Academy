import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { isAuthorizedAdminId, isAuthorizedAdminEmail, verifyAdminRequest, verifyAdminToken } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';
import { Lesson, Module } from '@/lib/types';

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

// GET: Fetch modules and lessons for a course
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const admin = createAdminClient();
    if (admin && courseId) {
      // 1. Fetch modules for this course
      const { data: modsData, error: modErr } = await admin
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (!modErr && modsData) {
        const modIds = modsData.map((m: any) => m.id);
        let lessonsData: any[] = [];

        if (modIds.length > 0) {
          const { data: lData, error: lErr } = await admin
            .from('lessons')
            .select('*')
            .in('module_id', modIds)
            .order('sort_order', { ascending: true });

          if (!lErr && lData) {
            lessonsData = lData;
          }
        }

        return NextResponse.json({
          success: true,
          modules: modsData,
          lessons: lessonsData,
        });
      }
    }

    // Fallback in-memory
    const localMods = courseId
      ? db.modules.filter((m) => m.course_id === courseId)
      : db.modules;
    const modIds = new Set(localMods.map((m) => m.id));
    const localLessons = db.lessons.filter((l) => modIds.has(l.module_id));

    return NextResponse.json({
      success: true,
      modules: localMods,
      lessons: localLessons,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch lessons.' }, { status: 500 });
  }
}

// POST: Create a new Chapter (Module) or Lesson
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Action: Create Chapter / Module
    if (body.action === 'create_chapter' || body.type === 'chapter') {
      const { course_id, title, description = '', sort_order = 1 } = body;
      if (!course_id || !title || !title.trim()) {
        return NextResponse.json({ error: 'Course ID and Chapter title are required.' }, { status: 400 });
      }

      const moduleId = crypto.randomUUID();
      const modulePayload = {
        id: moduleId,
        course_id,
        title: title.trim(),
        description: (description || '').trim(),
        sort_order: Number(sort_order) || 1,
        created_at: nowIso,
      };

      if (admin) {
        const { error: insErr } = await admin.from('modules').insert(modulePayload);
        if (insErr) {
          console.error('Supabase module insert error:', insErr);
          return NextResponse.json({ error: `Database error: ${insErr.message}` }, { status: 500 });
        }
      }

      db.modules.push(modulePayload);
      try {
        revalidatePath(`/courses/${course_id}`);
        revalidatePath('/dashboard');
      } catch {}

      return NextResponse.json({ success: true, module: modulePayload });
    }

    // 2. Action: Create Lesson & Study Notes
    const {
      module_id,
      title,
      description = '',
      youtube_video_id = '',
      duration_minutes = 45,
      material_path,
      material_name,
      sort_order = 1,
      is_free_preview = false,
      published = true,
      quiz_id,
    } = body;

    if (!module_id || !title || !title.trim()) {
      return NextResponse.json({ error: 'Chapter (module_id) and lesson title are required.' }, { status: 400 });
    }

    const lessonId = crypto.randomUUID();
    const lessonPayload: Record<string, any> = {
      id: lessonId,
      module_id,
      title: title.trim(),
      description: (description || '').trim(),
      youtube_video_id: (youtube_video_id || '').trim(),
      duration_minutes: Number(duration_minutes) || 45,
      material_path: material_path ? String(material_path).trim() : null,
      material_name: material_name ? String(material_name).trim() : null,
      sort_order: Number(sort_order) || 1,
      is_free_preview: Boolean(is_free_preview),
      published: Boolean(published),
      quiz_id: quiz_id || null,
      created_at: nowIso,
    };

    if (admin) {
      const { error: insErr } = await admin.from('lessons').insert(lessonPayload);
      if (insErr) {
        console.error('Supabase lesson insert error:', insErr);
        return NextResponse.json({ error: `Database error: ${insErr.message}` }, { status: 500 });
      }
    }

    db.lessons.push(lessonPayload as any);

    try {
      revalidatePath('/courses');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/materials');
      revalidatePath('/notes');
    } catch {}

    return NextResponse.json({ success: true, lesson: lessonPayload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save lesson.' }, { status: 500 });
  }
}

// PUT: Update an existing Lesson
export async function PUT(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lesson ID is required.' }, { status: 400 });
    }

    const allowedCols = [
      'module_id',
      'title',
      'description',
      'youtube_video_id',
      'duration_minutes',
      'material_path',
      'material_name',
      'sort_order',
      'is_free_preview',
      'published',
      'quiz_id',
    ];

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(updates)) {
      if (allowedCols.includes(key)) {
        sanitized[key] = updates[key];
      }
    }

    const admin = createAdminClient();
    if (admin) {
      const { error: updErr } = await admin.from('lessons').update(sanitized).eq('id', id);
      if (updErr) {
        console.error('Supabase lesson update error:', updErr);
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
    }

    // Sync in-memory DB
    const idx = db.lessons.findIndex((l) => l.id === id);
    if (idx !== -1) {
      db.lessons[idx] = { ...db.lessons[idx], ...sanitized };
    }

    try {
      revalidatePath('/courses');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/materials');
    } catch {}

    return NextResponse.json({ success: true, updated: sanitized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update lesson.' }, { status: 500 });
  }
}

// DELETE: Delete a Lesson or Module
export async function DELETE(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'lesson';

    if (!id) {
      return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (type === 'chapter' || type === 'module') {
      if (admin) {
        // Cascade delete lessons in this chapter
        await admin.from('lessons').delete().eq('module_id', id);
        const { error: modErr } = await admin.from('modules').delete().eq('id', id);
        if (modErr) {
          return NextResponse.json({ error: modErr.message }, { status: 500 });
        }
      }
      db.lessons = db.lessons.filter((l) => l.module_id !== id);
      db.modules = db.modules.filter((m) => m.id !== id);
    } else {
      if (admin) {
        const { error: lErr } = await admin.from('lessons').delete().eq('id', id);
        if (lErr) {
          return NextResponse.json({ error: lErr.message }, { status: 500 });
        }
      }
      db.lessons = db.lessons.filter((l) => l.id !== id);
    }

    try {
      revalidatePath('/courses');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/materials');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete.' }, { status: 500 });
  }
}

