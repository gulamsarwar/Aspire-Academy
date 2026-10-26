import { NextRequest, NextResponse } from 'next/server';
import { normalizeStudentId } from '@/lib/data/mock-db';
import {
  getStudentDownloadsFromDatabase,
  recordStudentDownloadInDatabase,
} from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = normalizeStudentId(searchParams.get('studentId') || '');
  const downloads = await getStudentDownloadsFromDatabase(studentId);
  return NextResponse.json({ success: true, downloads });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId: rawStudentId, lessonId, title, fileName, fileSize } = body;
    const studentId = normalizeStudentId(rawStudentId || '');

    if (!title || !fileName) {
      return NextResponse.json({ error: 'File details required' }, { status: 400 });
    }

    const download = await recordStudentDownloadInDatabase({
      student_id: studentId,
      lesson_id: lessonId,
      title,
      file_name: fileName,
      file_size: fileSize || '3.5 MB',
    });

    return NextResponse.json({ success: true, download });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
