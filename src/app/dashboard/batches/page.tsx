'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { Calendar, Clock, Users, ArrowRight, BookOpen, Loader2 } from 'lucide-react';

export default function StudentBatchesPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    const activeUser =
      user ||
      (typeof window !== 'undefined' && localStorage.getItem('aspire_user')
        ? JSON.parse(localStorage.getItem('aspire_user')!)
        : null);

    if (!activeUser) {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent('/dashboard/batches');
      return;
    }

    async function fetchBatches() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(activeUser.id)}`);
        if (!res.ok) throw new Error('Failed to load batches');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load student batches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, [isAuthReady, user?.id, router]);

  if (!isAuthReady || (!user && loading)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading your enrolled batches...</p>
      </div>
    );
  }

  const enrollments = data?.enrollments || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Enrolled Batches
        </h1>
        <p className="text-xs text-slate-500">
          Timetables, schedule details, and faculty for your enrolled batches.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-56" />
          ))}
        </div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrollments.map((enr: any) => {
            const batch = enr.batch;
            const course = enr.course;
            if (!batch) return null;

            return (
              <div
                key={enr.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-lg">
                      {course?.target_class || course?.category}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Status: Active
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{batch.name}</h3>
                  <p className="text-xs font-semibold text-slate-600">
                    Course: <strong>{course?.title}</strong>
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span><strong>Timing:</strong> {batch.schedule_description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span>
                        <strong>Duration:</strong> {new Date(batch.start_at).toLocaleDateString('en-IN')} – {new Date(batch.end_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span><strong>Batch Faculty:</strong> {batch.instructor_name || course?.instructor_name || 'Shekhar Sir'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={course?.slug ? `/dashboard/courses/${course.slug}/learn` : '/dashboard/courses'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm transition"
                  >
                    <span>Open Learning Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/dashboard/live"
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    View Live Classes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Active Batches</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You are not enrolled in any batch currently. Choose an open batch from our
            courses.
          </p>
          <Link
            href="/courses"
            className="inline-block py-2 px-4 rounded-xl text-xs font-bold text-white bg-[#046BD2]"
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
