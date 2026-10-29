import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { isAuthorizedAdminId, verifyAdminRequest } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';
import { extractYouTubeVideoId } from '@/lib/youtube';
import { Course } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  const verified = verifyAdminRequest(req);
  if (verified.isAuthorized) return true;

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('aspire_admin_session')?.value;
  const sessionCookie = cookieStore.get('aspire_session_id')?.value;

  const candidateId = adminCookie || sessionCookie;
  if (!candidateId) return false;

  return isAuthorizedAdminId(candidateId);
}

// GET: Fetch all courses for Admin
export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, courses: data });
      }
    }

    return NextResponse.json({ success: true, courses: db.courses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Create a new Course in Supabase and sync memory
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrative credentials required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      subtitle = 'Comprehensive Board & Entrance Preparation',
      description = 'Structured conceptual classes, NCERT line-by-line solutions and chapter tests.',
      category = 'Bihar Board',
      target_class = 'Class 12',
      thumbnail_url,
      thumbnail_r2_key,
      price = 499,
      original_price = 1499,
      duration_weeks = 24,
      instructor_name = 'Shekhar Sir',
      published = true,
      video_url,
      lesson_title,
      is_free_preview = true,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Course title is required.' }, { status: 400 });
    }

    // 1. Generate clean unique slug
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    // 2. Resolve thumbnail
    const detectedVideoId = video_url ? extractYouTubeVideoId(video_url) : null;
    let finalThumbnail = (thumbnail_url || '').trim();
    if (detectedVideoId && (!finalThumbnail || finalThumbnail.includes('unsplash.com/photo-1434030216411'))) {
      finalThumbnail = `https://img.youtube.com/vi/${detectedVideoId}/hqdefault.jpg`;
    }
    if (!finalThumbnail) {
      finalThumbnail = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80';
    }

    const newCourseId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const coursePayload: Record<string, any> = {
      id: newCourseId,
      slug: uniqueSlug,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      category,
      target_class,
      thumbnail_url: finalThumbnail,
      price: Number(price),
      original_price: Number(original_price),
      currency: 'INR',
      published: Boolean(published),
      featured: false,
      language: 'Hinglish',
      duration_weeks: Number(duration_weeks),
      instructor_name: instructor_name.trim(),
      instructor_title: 'Senior Faculty',
      features: ['Full Syllabus Video Lectures', 'NCERT Handwritten Notes', 'Chapter PYQ Bank'],
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (thumbnail_r2_key) {
      coursePayload.thumbnail_r2_key = thumbnail_r2_key;
    }

    // 3. Persist Course to Supabase with Service Role
    const admin = createAdminClient();
    if (admin) {
      const { error: courseErr } = await admin.from('courses').insert(coursePayload);
      if (courseErr) {
        console.error('Supabase Course Insert Error:', courseErr);
        // If error occurred on thumbnail_r2_key column, retry without it
        if (courseErr.message?.includes('thumbnail_r2_key')) {
          delete coursePayload.thumbnail_r2_key;
          const retry = await admin.from('courses').insert(coursePayload);
          if (retry.error) {
            console.error('Supabase retry failed:', retry.error);
          }
        }
      }
    }

    // Also sync to in-memory database
    db.courses.unshift(coursePayload as Course);

    // 4. Create first default Batch in Supabase so students can enroll immediately
    const batchId = crypto.randomUUID();
    const batchPayload = {
      id: batchId,
      course_id: newCourseId,
      name: 'Target 2026-27 Batch',
      schedule_description: 'Mon, Wed, Fri — 05:00 PM to 06:30 PM',
      start_at: nowIso,
      end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      capacity: 150,
      enrolled_count: 0,
      enrollment_open: true,
      instructor_name: instructor_name.trim(),
      created_at: nowIso,
    };

    if (admin) {
      try {
        await admin.from('batches').insert(batchPayload);
      } catch (e) {
        console.warn('Batch insert error in Supabase:', e);
      }
    }
    db.batches.unshift(batchPayload as any);

    // 5. If video link provided, create Chapter 1 and Lesson 1
    let createdLesson: any = null;
    if (detectedVideoId) {
      const moduleId = crypto.randomUUID();
      const modulePayload = {
        id: moduleId,
        course_id: newCourseId,
        title: 'Chapter 1: Foundation & Core Concepts',
        sort_order: 1,
        created_at: nowIso,
      };

      if (admin) {
        try {
          await admin.from('modules').insert(modulePayload);
        } catch (e) {
          console.warn('Module insert error in Supabase:', e);
        }
      }
      db.modules.push(modulePayload);

      const lessonId = crypto.randomUUID();
      const savedLessonTitle = (lesson_title || '').trim() || `${title.trim()} - Intro & Demo Lecture`;
      const lessonPayload = {
        id: lessonId,
        module_id: moduleId,
        title: savedLessonTitle,
        description: 'Comprehensive introductory lecture, key chapter concepts, and syllabus walkthrough.',
        youtube_video_id: detectedVideoId,
        video_source_type: 'youtube',
        duration_minutes: 45,
        sort_order: 1,
        is_free_preview: Boolean(is_free_preview),
        published: true,
        created_at: nowIso,
      };

      if (admin) {
        try {
          await admin.from('lessons').insert(lessonPayload);
        } catch (e) {
          console.warn('Lesson insert error in Supabase:', e);
        }
      }
      db.lessons.push(lessonPayload as any);
      createdLesson = lessonPayload;
    }

    // 6. Revalidate cache so students see it instantly
    try {
      revalidatePath('/courses');
      revalidatePath(`/courses/${uniqueSlug}`);
      revalidatePath('/dashboard/courses');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      course: coursePayload,
      batch: batchPayload,
      lesson: createdLesson,
    });
  } catch (err: any) {
    console.error('Course create route error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create course.' }, { status: 500 });
  }
}

// PUT: Update an existing Course in Supabase and memory
export async function PUT(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from('courses').update(updates).eq('id', id);
      if (error) {
        console.error('Supabase update course error:', error);
      }
    }

    // Sync memory
    db.updateCourse(id, updates);

    try {
      revalidatePath('/courses');
      revalidatePath('/dashboard/courses');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, updated: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update course.' }, { status: 500 });
  }
}

// DELETE: Delete a course
export async function DELETE(req: NextRequest) {
  try {
    const isAuthorized = await checkAdminAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('id');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient();
    if (admin) {
      await admin.from('courses').delete().eq('id', courseId);
    }

    // Remove from in-memory DB
    db.courses = db.courses.filter((c) => c.id !== courseId);

    try {
      revalidatePath('/courses');
      revalidatePath('/dashboard/courses');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete course.' }, { status: 500 });
  }
}

