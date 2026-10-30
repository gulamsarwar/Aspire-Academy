import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { isAuthorizedAdminId, isAuthorizedAdminEmail, verifyAdminRequest, verifyAdminToken } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';
import { Batch } from '@/lib/types';

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

// GET: Fetch batches with live enrollment counts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const admin = createAdminClient();
    if (admin) {
      let query = admin.from('batches').select('*').order('created_at', { ascending: false });
      if (courseId && courseId !== 'all') {
        query = query.eq('course_id', courseId);
      }

      const { data: batchesData, error: batchErr } = await query;

      if (!batchErr && batchesData) {
        // Fetch real enrollment counts per batch
        const { data: enrData } = await admin
          .from('enrollments')
          .select('batch_id')
          .eq('status', 'active');

        const countMap: Record<string, number> = {};
        if (enrData) {
          enrData.forEach((row: { batch_id?: string | null }) => {
            if (row.batch_id) {
              countMap[row.batch_id] = (countMap[row.batch_id] || 0) + 1;
            }
          });
        }

        const enriched = batchesData.map((b: any) => ({
          ...b,
          enrolled_count: countMap[b.id] ?? b.enrolled_count ?? 0,
        }));

        return NextResponse.json({ success: true, batches: enriched });
      }
    }

    // Fallback in-memory
    let local = db.batches;
    if (courseId && courseId !== 'all') {
      local = local.filter((b) => b.course_id === courseId);
    }
    return NextResponse.json({ success: true, batches: local });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch batches.' }, { status: 500 });
  }
}

// POST: Create a new batch
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized. Admin credentials required.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      course_id,
      name,
      schedule_description = 'Mon, Wed, Fri — 05:00 PM to 06:30 PM',
      start_at,
      end_at,
      capacity = 150,
      instructor_name = 'Shekhar Sir',
      enrollment_open = true,
    } = body;

    if (!course_id || !name || !name.trim()) {
      return NextResponse.json(
        { error: 'Course ID and batch name are required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    if (admin) {
      // 1. Verify that the parent course actually exists in Supabase
      const { data: parentCourse, error: courseCheckErr } = await admin
        .from('courses')
        .select('id, title')
        .eq('id', course_id)
        .single();

      if (courseCheckErr || !parentCourse) {
        return NextResponse.json(
          { error: 'Associated course was not found in database.' },
          { status: 404 }
        );
      }

      // 2. Prevent duplicate batch names under the same course
      const { data: existingDup } = await admin
        .from('batches')
        .select('id')
        .eq('course_id', course_id)
        .ilike('name', name.trim())
        .limit(1);

      if (existingDup && existingDup.length > 0) {
        return NextResponse.json(
          { error: `A batch named "${name.trim()}" already exists for this course.` },
          { status: 400 }
        );
      }
    }

    const batchId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const dbBatchPayload = {
      id: batchId,
      course_id,
      name: name.trim(),
      schedule_description: schedule_description.trim(),
      start_at: start_at || nowIso,
      end_at: end_at || new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      capacity: Number(capacity) || 150,
      enrollment_open: Boolean(enrollment_open),
      instructor_name: (instructor_name || 'Shekhar Sir').trim(),
      created_at: nowIso,
    };

    if (admin) {
      const { error: insErr } = await admin.from('batches').insert(dbBatchPayload);
      if (insErr) {
        console.error('Supabase batch insert error:', insErr);
        return NextResponse.json(
          { error: `Database error: ${insErr.message}` },
          { status: 500 }
        );
      }
    }

    // Sync in-memory database
    db.batches.unshift({ ...dbBatchPayload, enrolled_count: 0 } as any);

    try {
      revalidatePath('/');
      revalidatePath('/courses');
      revalidatePath(`/courses/${course_id}`);
      revalidatePath('/batches');
      revalidatePath('/dashboard/batches');
    } catch {}

    return NextResponse.json({
      success: true,
      batch: { ...dbBatchPayload, enrolled_count: 0 },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create batch.' }, { status: 500 });
  }
}

// PUT: Update an existing batch
export async function PUT(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 });
    }

    const allowedCols = [
      'name',
      'schedule_description',
      'start_at',
      'end_at',
      'capacity',
      'enrollment_open',
      'instructor_name',
    ];

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(updates)) {
      if (allowedCols.includes(key)) {
        sanitized[key] = updates[key];
      }
    }

    const admin = createAdminClient();
    if (admin) {
      const { error: updErr } = await admin.from('batches').update(sanitized).eq('id', id);
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
    }

    // Sync in-memory DB
    const idx = db.batches.findIndex((b) => b.id === id);
    if (idx !== -1) {
      db.batches[idx] = { ...db.batches[idx], ...sanitized };
    }

    try {
      revalidatePath('/courses');
      revalidatePath('/batches');
      revalidatePath('/dashboard/batches');
    } catch {}

    return NextResponse.json({ success: true, updated: sanitized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update batch.' }, { status: 500 });
  }
}

// DELETE: Delete a batch safely
export async function DELETE(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('id');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (admin) {
      // Safety check: Prevent deletion if students are enrolled
      const { count } = await admin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId);

      if (count && count > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete batch because ${count} student(s) are actively enrolled in it. Please close admissions instead to prevent new enrollments.`,
          },
          { status: 400 }
        );
      }

      const { error: delErr } = await admin.from('batches').delete().eq('id', batchId);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    }

    // Remove from in-memory DB
    db.batches = db.batches.filter((b) => b.id !== batchId);

    try {
      revalidatePath('/courses');
      revalidatePath('/batches');
      revalidatePath('/dashboard/batches');
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete batch.' }, { status: 500 });
  }
}

