import { NextRequest, NextResponse } from 'next/server';
import { db, normalizeStudentId } from '@/lib/data/mock-db';
import {
  getStudentEnrollmentsFromDatabase,
  getStudentOrdersFromDatabase,
  getStudentBookmarksFromDatabase,
  getStudentDoubtsFromDatabase,
  getStudentDownloadsFromDatabase,
  getStudentAttemptsFromDatabase,
} from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionCookie = req.cookies.get('aspire_session_id')?.value;
    const rawStudentId = searchParams.get('studentId') || sessionCookie;

    if (!rawStudentId) {
      return NextResponse.json({
        success: true,
        studentId: '',
        enrollments: [],
        orders: [],
        liveClasses: [],
        materials: [],
        progressList: [],
        tests: [],
        bookmarks: [],
        doubts: [],
        downloads: [],
        attempts: [],
      });
    }

    const studentId = normalizeStudentId(rawStudentId);

    // 1. Fetch real student enrollments
    const enrollments = await getStudentEnrollmentsFromDatabase(studentId);
    const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
    const enrolledBatchIds = new Set(enrollments.map((e) => e.batch_id));

    // 2. Fetch real student orders
    const orders = await getStudentOrdersFromDatabase(studentId);

    // 3. Filter Live Classes belonging to student's enrolled courses/batches (plus open sessions)
    const liveClasses = db.liveClasses.filter(
      (lc) =>
        enrolledCourseIds.has(lc.course_id) ||
        enrolledBatchIds.has(lc.batch_id) ||
        enrollments.length === 0 // Show sample live schedules if new student
    ).map((lc) => ({
      ...lc,
      course: db.getCourseById(lc.course_id),
      batch: db.getBatchById(lc.batch_id),
      isAccessible: enrolledCourseIds.has(lc.course_id),
    }));

    // 4. Authorized Study Materials
    const materials = db.lessons
      .filter((l) => l.material_path)
      .map((lesson) => {
        const module = db.modules.find((m) => m.id === lesson.module_id);
        const course = db.getCourseById(module?.course_id || '');
        const isAccessible =
          enrolledCourseIds.has(course?.id || '') || lesson.is_free_preview;

        return {
          id: lesson.id,
          lessonTitle: lesson.title,
          materialName: lesson.material_name || `${lesson.title} Notes`,
          materialPath: lesson.material_path,
          courseId: course?.id,
          courseTitle: course?.title,
          courseCategory: course?.category,
          isAccessible,
          isFreePreview: lesson.is_free_preview,
        };
      });

    // 5. Course Learning Progress
    const progressList = enrollments.map((enr) => {
      const p = db.getStudentProgressForCourse(studentId, enr.course_id);
      return {
        courseId: enr.course_id,
        courseTitle: enr.course?.title,
        percent: p.percent,
        completedCount: p.completedCount,
        totalCount: p.totalCount,
        completedLessonIds: p.completedLessonIds,
      };
    });

    // 6. Quizzes & Tests for Enrolled Subjects
    const allQuizzes = db.getQuizzes();
    const tests = allQuizzes.map((q) => ({
      ...q,
      isAccessible: enrolledCourseIds.has(q.course_id),
    }));

    // 7. Student Personal Data (Bookmarks, Doubts, Downloads, Test Attempts)
    const bookmarks = await getStudentBookmarksFromDatabase(studentId);
    const doubts = await getStudentDoubtsFromDatabase(studentId);
    const downloads = await getStudentDownloadsFromDatabase(studentId);
    const attempts = await getStudentAttemptsFromDatabase(studentId);

    return NextResponse.json({
      success: true,
      studentId,
      enrollments,
      orders,
      liveClasses,
      materials,
      progressList,
      tests,
      bookmarks,
      doubts,
      downloads,
      attempts,
      quiz_attempts: attempts,
      allCourses: db.getCourses(true),
    });
  } catch (error: any) {
    console.error('Student dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve student dashboard data' },
      { status: 500 }
    );
  }
}
