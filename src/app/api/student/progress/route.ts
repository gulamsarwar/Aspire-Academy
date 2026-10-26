import { NextRequest, NextResponse } from 'next/server';
import { db, normalizeStudentId } from '@/lib/data/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId: rawStudentId, lessonId, courseId } = body;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
    }

    const studentId = normalizeStudentId(rawStudentId || '');
    const completed = db.toggleLessonProgress(studentId, lessonId);

    const progress = courseId
      ? db.getStudentProgressForCourse(studentId, courseId)
      : null;

    return NextResponse.json({
      success: true,
      lessonId,
      completed,
      progress,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
