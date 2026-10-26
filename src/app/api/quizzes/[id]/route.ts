import { NextRequest, NextResponse } from 'next/server';
import { db, normalizeStudentId } from '@/lib/data/mock-db';
import {
  getQuizByIdFromDatabase,
  submitQuizAttemptInDatabase,
  updateQuizInDatabase,
  deleteQuizInDatabase,
} from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode'); // 'exam' | 'admin' | 'review'

    // Security check: if mode is 'exam' or not explicitly admin, sanitize correct answers
    const sanitizeForExam = mode !== 'admin' && mode !== 'review';
    const quiz = await getQuizByIdFromDatabase(id, sanitizeForExam);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch quiz details' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { answers, timeTakenSeconds } = body;
    const sessionCookie = req.cookies.get('aspire_session_id')?.value;
    const rawStudentId = body.studentId || body.student_id || sessionCookie;

    if (!rawStudentId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to record test attempts.' },
        { status: 401 }
      );
    }

    const studentId = normalizeStudentId(rawStudentId);

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers payload is required.' },
        { status: 400 }
      );
    }

    // Server-side scoring using secure answer keys stored in database
    const attempt = await submitQuizAttemptInDatabase({
      studentId,
      quizId: id,
      answers,
      timeTakenSeconds,
    });

    // Also fetch full quiz with solutions for the post-submission review
    const fullQuizWithSolutions = await getQuizByIdFromDatabase(id, false);

    return NextResponse.json({
      success: true,
      attempt,
      solutions: fullQuizWithSolutions?.questions || [],
      message: `Test completed! You scored ${attempt.score} out of ${attempt.total_marks} (${attempt.percentage}%).`,
    });
  } catch (error: any) {
    console.error('Quiz submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit quiz attempt' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await updateQuizInDatabase(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quiz: updated,
      message: 'Quiz updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteQuizInDatabase(id);

    if (!success) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
