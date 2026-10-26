import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/mock-db';
import { saveQuizToDatabase } from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || searchParams.get('course_id') || undefined;
    const status = searchParams.get('status') || undefined;

    let quizzes = db.getQuizzes(courseId);
    if (status) {
      quizzes = quizzes.filter((q) => q.status === status || (status === 'published' && q.published));
    }

    return NextResponse.json({ success: true, quizzes });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body.title;
    const description = body.description || '';
    const courseId = body.courseId || body.course_id;
    const batchId = body.batchId || body.batch_id;
    const chapterId = body.chapterId || body.chapter_id;
    const lessonId = body.lessonId || body.lesson_id;
    const subject = body.subject || 'Biology';
    const targetClass = body.targetClass || body.target_class || 'Class 12th Board';
    const durationMinutes = Number(body.durationMinutes || body.duration_minutes || 30);
    const marksPerQuestion = Number(body.marksPerQuestion || body.marks_per_question || 1);
    const negativeMarking = Number(body.negativeMarking || body.negative_marking || 0);
    const passingPercentage = Number(body.passingPercentage || body.passing_percentage || 40);
    const attemptLimit = Number(body.attemptLimit || body.attempt_limit || 3);
    const status = body.status || 'published';
    const published = status === 'published';
    const questions = body.questions;

    if (!title || !courseId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid quiz payload: Title, course, and at least one question are required.' },
        { status: 400 }
      );
    }

    // Validate that each question has at least 2 options and a valid correct_option
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !q.question_text.trim()) {
        return NextResponse.json(
          { error: `Question #${i + 1} has empty description text.` },
          { status: 400 }
        );
      }
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return NextResponse.json(
          { error: `Question #${i + 1} must have at least 2 options.` },
          { status: 400 }
        );
      }
      if (!q.correct_option || !q.correct_option.trim()) {
        return NextResponse.json(
          { error: `Question #${i + 1} must have a correct option selected (A, B, C, or D).` },
          { status: 400 }
        );
      }
    }

    const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || marksPerQuestion), 0);
    const instructions = body.instructions || 'Read each question carefully. Select the most appropriate option.';
    const randomizeQuestions = Boolean(body.randomizeQuestions ?? body.randomize_questions ?? false);

    const createdQuiz = await saveQuizToDatabase(
      {
        course_id: courseId,
        batch_id: batchId || undefined,
        chapter_id: chapterId || undefined,
        lesson_id: lessonId || undefined,
        title,
        description: description || 'Chapter-wise MCQ Test with Mathematical Formatting',
        subject,
        target_class: targetClass,
        duration_minutes: durationMinutes,
        total_marks: totalMarks,
        marks_per_question: marksPerQuestion,
        negative_marking: negativeMarking,
        passing_percentage: passingPercentage,
        attempt_limit: attemptLimit,
        instructions,
        randomize_questions: randomizeQuestions,
        status,
        published,
      },
      questions
    );

    return NextResponse.json({
      success: true,
      quiz: createdQuiz,
      message: `Quiz "${createdQuiz.title}" with ${questions.length} questions saved successfully!`,
    });
  } catch (error: any) {
    console.error('Quiz creation error:', error);
    return NextResponse.json({ error: 'Failed to create and publish quiz' }, { status: 500 });
  }
}
