import { NextRequest, NextResponse } from 'next/server';
import { db, normalizeStudentId } from '@/lib/data/mock-db';
import {
  getStudentDoubtsFromDatabase,
  saveStudentDoubtToDatabase,
  answerStudentDoubtInDatabase,
} from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawStudentId = searchParams.get('studentId');
  const studentId = rawStudentId ? normalizeStudentId(rawStudentId) : undefined;

  const doubts = await getStudentDoubtsFromDatabase(studentId);
  return NextResponse.json({ success: true, doubts });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;
    const doubtId = body.doubtId || body.doubt_id;
    const answer = body.answer || body.answer_text;
    const facultyName = body.facultyName || body.faculty_name;
    const rawStudentId = body.studentId || body.student_id;
    const studentName = body.studentName || body.student_name;
    const courseId = body.courseId || body.course_id;
    const question = body.question || body.question_text;

    // Admin answering a doubt
    if (action === 'answer' && doubtId && answer) {
      const answered = await answerStudentDoubtInDatabase(doubtId, answer, facultyName || 'Shekhar Sir');
      return NextResponse.json({ success: true, doubt: answered });
    }

    // Student submitting a new doubt
    const studentId = normalizeStudentId(rawStudentId || '');
    if (!question || !courseId) {
      return NextResponse.json({ error: 'Question text and course are required.' }, { status: 400 });
    }

    const course = db.getCourseById(courseId);
    const doubt = await saveStudentDoubtToDatabase({
      student_id: studentId,
      student_name: studentName || 'Student',
      course_id: courseId,
      course_title: course?.title,
      question,
    });

    return NextResponse.json({
      success: true,
      doubt,
      message: 'Your doubt has been submitted to Shekhar Sir & faculty! You will be notified once answered.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
