import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAuthorizedAdminId, verifyAdminRequest } from '@/lib/auth/admin';
import { db } from '@/lib/data/mock-db';
import { getR2Diagnostic, createSignedPlaybackUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    const directKey = searchParams.get('key');
    const redirectMode = searchParams.get('redirect') === '1';

    let r2Key = directKey || '';
    let isFreePreview = false;
    let courseId = '';

    // If lessonId is given, resolve lesson from database
    if (lessonId) {
      const lesson = db.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        r2Key = lesson.r2_object_key || r2Key;
        isFreePreview = Boolean(lesson.is_free_preview);

        const mod = db.modules.find((m) => m.id === lesson.module_id);
        courseId = mod?.course_id || '';
      }
    }

    if (!r2Key) {
      return NextResponse.json(
        { error: 'Lesson or video key not specified.' },
        { status: 400 }
      );
    }

    // Public thumbnails can be streamed directly or redirected
    const isThumbnail = r2Key.startsWith('thumbnails/');

    if (!isThumbnail && !isFreePreview) {
      // Must authenticate student and verify active enrollment
      const cookieStore = await cookies();
      const adminCookie = cookieStore.get('aspire_admin_session')?.value;
      const sessionCookie = cookieStore.get('aspire_session_id')?.value;
      const candidateId = adminCookie || sessionCookie;

      if (!candidateId) {
        return NextResponse.json(
          { error: 'Authentication required to access private course videos.' },
          { status: 401 }
        );
      }

      const verifiedAdmin = verifyAdminRequest(req);
      const isAdmin = verifiedAdmin.isAuthorized || isAuthorizedAdminId(candidateId);

      if (!isAdmin) {
        if (!courseId) {
          // Find courseId by r2Key in lessons
          const matchingLesson = db.lessons.find((l) => l.r2_object_key === r2Key);
          if (matchingLesson) {
            const mod = db.modules.find((m) => m.id === matchingLesson.module_id);
            courseId = mod?.course_id || '';
            isFreePreview = Boolean(matchingLesson.is_free_preview);
          }
        }

        if (!isFreePreview) {
          const isEnrolled = courseId ? db.isStudentEnrolled(candidateId, courseId) : false;
          if (!isEnrolled) {
            return NextResponse.json(
              { error: 'Enrollment required. You have not purchased access to this course.' },
              { status: 403 }
            );
          }
        }
      }
    }

    const diagnostic = getR2Diagnostic();
    if (!diagnostic.isConfigured) {
      return NextResponse.json(
        {
          error: 'Cloudflare R2 is not configured.',
          missing: diagnostic.missing,
        },
        { status: 503 }
      );
    }

    // Generate short-lived signed playback URL (valid 2 hours)
    const playbackUrl = await createSignedPlaybackUrl({
      key: r2Key,
      expiresInSeconds: 7200,
    });

    if (redirectMode) {
      return NextResponse.redirect(playbackUrl);
    }

    return NextResponse.json({
      success: true,
      playbackUrl,
      expiresIn: 7200,
      key: r2Key,
    });
  } catch (error: any) {
    console.error('R2 playback authorization error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to authorize video playback.' },
      { status: 500 }
    );
  }
}
