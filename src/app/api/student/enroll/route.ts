import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, normalizeStudentId } from '@/lib/data/mock-db';
import { directEnrollStudentInDatabase } from '@/lib/data/supabase-service';

const enrollSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  batchId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = enrollSchema.safeParse(json);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid enrollment payload', details: result.error.format() },
        { status: 400 }
      );
    }

    const { studentId: rawStudentId, courseId, batchId: requestedBatchId } = result.data;
    const studentId = normalizeStudentId(rawStudentId);

    // 1. Verify course
    const course = db.getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // 2. Resolve batch
    let batchId = requestedBatchId;
    if (!batchId) {
      const batches = db.getBatchesByCourseId(courseId);
      const openBatch = batches.find((b) => b.enrollment_open) || batches[0];
      if (!openBatch) {
        return NextResponse.json({ error: 'No open batch found for this course' }, { status: 400 });
      }
      batchId = openBatch.id;
    }

    const batch = db.getBatchById(batchId);

    // 3. Perform direct enrollment
    const enrollment = await directEnrollStudentInDatabase({
      studentId,
      courseId,
      batchId,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course!',
      enrollment: {
        ...enrollment,
        course,
        batch,
      },
    });
  } catch (error: any) {
    console.error('Direct enrollment API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to activate enrollment' },
      { status: 500 }
    );
  }
}
