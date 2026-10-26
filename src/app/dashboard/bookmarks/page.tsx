'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { Bookmark, PlayCircle, Trash2, BookOpen, Clock, Loader2 } from 'lucide-react';

export default function BookmarksPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        setLoading(true);
        if (!user?.id) {
          setData({ bookmarks: [] });
          return;
        }
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user.id)}`);
        if (!res.ok) throw new Error('Failed to load bookmarks');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, [user?.id]);

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      setRemovingId(bookmarkId);
      await fetch(`/api/student/bookmarks?id=${bookmarkId}`, { method: 'DELETE' });
      setData((prev: any) => ({
        ...prev,
        bookmarks: prev?.bookmarks?.filter((b: any) => b.id !== bookmarkId),
      }));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const bookmarks = data?.bookmarks || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Bookmarked Lectures & Key Topics
        </h1>
        <p className="text-xs text-slate-500">
          Saved chapters and important explanations for quick revision before examinations.
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bm: any) => (
            <div
              key={bm.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#046BD2] bg-blue-50 px-2.5 py-0.5 rounded">
                    Bookmarked Lesson
                  </span>
                  <button
                    onClick={() => handleRemoveBookmark(bm.id)}
                    disabled={removingId === bm.id}
                    className="text-slate-400 hover:text-rose-600 transition p-1"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {bm.lesson_title || 'Important Lesson Lecture'}
                </h3>

                <p className="text-xs text-slate-500">
                  Course: {bm.course?.title || 'Enrolled Course'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={bm.course?.slug ? `/dashboard/courses/${bm.course.slug}/learn` : '/dashboard/courses'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-sm"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume Learning</span>
                </Link>

                <span className="text-[11px] text-slate-400">
                  {new Date(bm.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <Bookmark className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Bookmarks Saved</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            While watching video lectures in your study room, click the bookmark icon to save key lessons here.
          </p>
          <Link
            href="/dashboard/courses"
            className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2]"
          >
            Go to My Courses
          </Link>
        </div>
      )}
    </div>
  );
}
