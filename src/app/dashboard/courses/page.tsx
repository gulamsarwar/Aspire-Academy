'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  BookOpen,
  Calendar,
  PlayCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent('/dashboard/courses'));
      return;
    }

    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user!.id)}`);
        if (!res.ok) throw new Error('Failed to load courses');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load student courses:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [isAuthReady, user?.id, router]);

  if (!isAuthReady || (!user && loading)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading your enrolled courses...</p>
      </div>
    );
  }

  const enrollments = data?.enrollments || [];
  const progressList = data?.progressList || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Enrolled Courses
          </h1>
          <p className="text-xs text-slate-500">
            Courses linked to your verified student account with full lesson access.
          </p>
        </div>

        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#046BD2] text-white hover:bg-[#0352A0] transition shadow-sm self-start sm:self-auto"
        >
          <span>Explore More Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : enrollments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enr: any) => {
            const course = enr.course;
            if (!course) return null;

            const progress = progressList.find((p: any) => p.courseId === course.id) || {
              percent: 0,
              completedCount: 0,
              totalCount: 0,
            };

            return (
              <div
                key={enr.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                    <img
                      src={course.thumbnail_url || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-[#0B192C]/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {course.target_class || course.category}
                      </span>
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Enrolled</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {course.title}
                    </h3>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-[#046BD2]" />
                        <span>{enr.batch?.name || 'Assigned Batch'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {enr.batch?.schedule_description || 'Regular Lecture Timings'}
                      </p>
                    </div>

                    {/* Progress tracking */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Learning Progress</span>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#046BD2] rounded-full transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {progress.completedCount} of {progress.totalCount} completed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  <Link
                    href={`/dashboard/courses/${course.slug}/learn`}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Open Study Room</span>
                  </Link>
                  <Link
                    href="/dashboard/tests"
                    className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Tests
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-lg">No Courses Enrolled Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Browse our course catalog, pick an available batch timing, and enroll securely
            via UPI.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] text-white hover:bg-[#0352A0] shadow-md transition"
          >
            <span>Browse Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
