import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { checkServerAdminAuth } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/data/mock-db';
import { extractYouTubeVideoId } from '@/lib/youtube';
import { Course } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function checkAdminAuth(req: NextRequest): Promise<boolean> {
  return checkServerAdminAuth(req);
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
        // Keep in-memory DB in sync with live Supabase database
        db.courses = data as Course[];
        return NextResponse.json({ success: true, courses: data });
      }
      if (error) {
        console.warn('Supabase courses fetch notice:', error.message);
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
      instructor_title: 'Senior Faculty & Academic Director',
      instructor_avatar: null,
      features: ['Full Syllabus Video Lectures', 'NCERT Handwritten Notes', 'Chapter PYQ Bank'],
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 3. Persist Course to Supabase
    const admin = createAdminClient();
    if (admin) {
      const { error: courseErr } = await admin.from('courses').insert(coursePayload);
      if (courseErr) {
        console.error('Supabase Course Insert Error:', courseErr);
        return NextResponse.json(
          { error: `Database error: ${courseErr.message}` },
          { status: 500 }
        );
      }
    }

    // Also sync to in-memory database
    db.courses.unshift(coursePayload as Course);

    // 4. Create first default Batch in Supabase so students can enroll immediately
    const batchId = crypto.randomUUID();
    const dbBatchPayload = {
      id: batchId,
      course_id: newCourseId,
      name: 'Target 2026-27 Batch',
      schedule_description: 'Mon, Wed, Fri — 05:00 PM to 06:30 PM',
      start_at: nowIso,
      end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      capacity: 150,
      enrollment_open: true,
      instructor_name: instructor_name.trim(),
      created_at: nowIso,
    };

    if (admin) {
      try {
        await admin.from('batches').insert(dbBatchPayload);
      } catch (e) {
        console.warn('Batch insert error in Supabase:', e);
      }
    }
    db.batches.unshift({ ...dbBatchPayload, enrolled_count: 0 } as any);

    // 5. If video link provided, create Chapter 1 and Lesson 1
    let createdLesson: any = null;
    if (detectedVideoId) {
      const moduleId = crypto.randomUUID();
      const modulePayload = {
        id: moduleId,
        course_id: newCourseId,
        title: 'Chapter 1: Foundation & Core Concepts',
        description: 'Key chapter concepts, introductory lectures and syllabus walkthrough.',
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
        duration_minutes: 45,
        material_path: null,
        material_name: null,
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

    // 6. Invalidate Next.js cache so the public courses page and student dashboard update immediately
    try {
      revalidatePath('/');
      revalidatePath('/courses');
      revalidatePath(`/courses/${uniqueSlug}`);
      revalidatePath('/batches');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/courses');
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      course: coursePayload,
      batch: dbBatchPayload,
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

    // Sanitize updates to allowed table columns
    const allowedCols = [
      'title', 'subtitle', 'description', 'category', 'target_class',
      'thumbnail_url', 'thumbnail_r2_key', 'price', 'original_price', 'currency', 'published',
      'featured', 'language', 'duration_weeks', 'instructor_name',
      'instructor_title', 'instructor_avatar', 'features', 'updated_at', 'slug'
    ];
    const sanitizedUpdates: Record<string, any> = {};
    for (const key of Object.keys(updates)) {
      if (allowedCols.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const admin = createAdminClient();
    if (admin) {
      const { error } = await admin.from('courses').update(sanitizedUpdates).eq('id', id);
      if (error) {
        console.error('Supabase update course error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Sync memory
    db.updateCourse(id, sanitizedUpdates);

    try {
      revalidatePath('/');
      revalidatePath('/courses');
      const targetCourse = db.getCourseById(id);
      if (targetCourse?.slug) {
        revalidatePath(`/courses/${targetCourse.slug}`);
      }
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/courses');
      revalidatePath('/batches');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, updated: sanitizedUpdates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update course.' }, { status: 500 });
  }
}

// DELETE: Delete a course safely
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
      // Safety check: prevent deleting course if students are already enrolled
      const { count } = await admin
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      if (count && count > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete course because ${count} student(s) are actively enrolled. Please unpublish the course instead to hide it from new admissions.`,
          },
          { status: 400 }
        );
      }

      // Delete dependent records first if cascading is not automatic
      await admin.from('batches').delete().eq('course_id', courseId);
      const { data: mods } = await admin.from('modules').select('id').eq('course_id', courseId);
      if (mods && mods.length > 0) {
        const modIds = mods.map((m) => m.id);
        await admin.from('lessons').delete().in('module_id', modIds);
        await admin.from('modules').delete().eq('course_id', courseId);
      }

      const { error: delErr } = await admin.from('courses').delete().eq('id', courseId);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    }

    // Remove from in-memory DB
    db.deleteCourse(courseId);

    try {
      revalidatePath('/');
      revalidatePath('/courses');
      revalidatePath('/batches');
      revalidatePath('/dashboard/courses');
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete course.' }, { status: 500 });
  }
}

