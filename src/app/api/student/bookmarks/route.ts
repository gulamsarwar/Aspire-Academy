import { NextRequest, NextResponse } from 'next/server';
import { normalizeStudentId } from '@/lib/data/mock-db';
import {
  getStudentBookmarksFromDatabase,
  saveStudentBookmarkToDatabase,
  deleteStudentBookmarkFromDatabase,
} from '@/lib/data/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = normalizeStudentId(searchParams.get('studentId') || '');
  const bookmarks = await getStudentBookmarksFromDatabase(studentId);
  return NextResponse.json({ success: true, bookmarks });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId: rawStudentId, resourceType, resourceId, title, url } = body;
    const studentId = normalizeStudentId(rawStudentId);

    if (!resourceId || !title) {
      return NextResponse.json({ error: 'Resource details required' }, { status: 400 });
    }

    const bookmark = await saveStudentBookmarkToDatabase({
      student_id: studentId,
      resource_type: resourceType || 'lesson',
      resource_id: resourceId,
      title,
      url: url || '/dashboard',
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = normalizeStudentId(searchParams.get('studentId') || '');
    const resourceId = searchParams.get('resourceId') || '';

    const deleted = await deleteStudentBookmarkFromDatabase(studentId, resourceId);
    return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
