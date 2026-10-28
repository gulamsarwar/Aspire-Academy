'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  BookOpen,
  Calendar,
  Video,
  Award,
  PlayCircle,
  Clock,
  ArrowRight,
  Bell,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileText,
  Bookmark,
  CheckSquare,
  Loader2,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent('/dashboard'));
      return;
    }

    async function fetchDashboard() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user!.id)}`);
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const json = await res.json();

        // Merge with local client storage cache for instant sync
        try {
          const cached = localStorage.getItem('aspire_student_enrollments');
          if (cached) {
            const cachedList = JSON.parse(cached);
            const serverEnrs = json.enrollments || [];
            const merged = [...serverEnrs];
            for (const c of cachedList) {
              if (!merged.some((m: any) => m.course_id === c.course_id)) {
                merged.unshift(c);
              }
            }
            json.enrollments = merged;
          }
        } catch {
          // ignore cache read error
        }

        setData(json);
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [isAuthReady, user?.id, router]);

  if (!isAuthReady || (!user && loading)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Restoring student session & verifying enrollments...</p>
      </div>
    );
  }

  const enrollments = data?.enrollments || [];
  const liveClasses = data?.liveClasses || [];
  const progressList = data?.progressList || [];
  const tests = data?.tests || [];
  const doubts = data?.doubts || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Greeting Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Session 2026-27 • Aspire Academy Online</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Welcome back, {user ? user.full_name : 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Continue where you left off. Watch interactive video lectures, download chapter
            diagram notes, submit doubts directly to Shekhar Sir, and attempt weekly online tests.
          </p>
        </div>
      </div>

      {/* Resume Learning Spotlight Card (PhysicsWallah / Unacademy Style) */}
      {enrollments.length > 0 && enrollments[0]?.course && (
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-500/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-sky-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Resume Next Lecture (पढ़ाई जारी रखें)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {enrollments[0].course.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Batch: <strong className="text-white font-bold">{enrollments[0].batch?.name || 'Academic Batch'}</strong> • Access your 1080p HD video player, handwritten diagram notes, and chapter tests.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href={`/dashboard/courses/${enrollments[0].course.slug}/learn`}
              className="px-6 py-3.5 rounded-2xl bg-[#046BD2] hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition-all hover:scale-105 flex items-center justify-center gap-2 text-center"
            >
              <PlayCircle className="w-5 h-5 fill-white text-blue-950" />
              <span>Resume Lecture</span>
            </Link>
            <Link
              href="/dashboard/tests"
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition text-center"
            >
              Chapter Tests
            </Link>
          </div>
        </div>
      )}

      {/* 2. Key Stats Summary */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Enrolled Courses</span>
              <span className="text-2xl font-black text-slate-900">{enrollments.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Active Batches</span>
              <span className="text-2xl font-black text-slate-900">{enrollments.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Scheduled Live Classes</span>
              <span className="text-2xl font-black text-slate-900">{liveClasses.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Available Tests</span>
              <span className="text-2xl font-black text-slate-900">{tests.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Feature Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          href="/dashboard/courses"
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#046BD2] hover:shadow-sm transition flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#046BD2] group-hover:bg-[#046BD2] group-hover:text-white transition flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">My Courses</span>
        </Link>

        <Link
          href="/dashboard/batches"
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#046BD2] hover:shadow-sm transition flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">My Batches</span>
        </Link>

        <Link
          href="/dashboard/live"
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#046BD2] hover:shadow-sm transition flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition flex items-center justify-center">
            <Video className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">Live Classes</span>
        </Link>

        <Link
          href="/dashboard/tests"
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#046BD2] hover:shadow-sm transition flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition flex items-center justify-center">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">All Tests</span>
        </Link>

        <Link
          href="/dashboard/materials"
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#046BD2] hover:shadow-sm transition flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">PDF Bank</span>
        </Link>

        <Link
          href="/dashboard/doubts"
          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#046BD2] hover:shadow-sm transition flex flex-col items-center text-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-800">Ask Doubts</span>
        </Link>
      </div>

      {/* 3. Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#046BD2]" />
            <span>My Enrolled Courses</span>
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-xs font-bold text-[#046BD2] hover:underline"
          >
            View All ({enrollments.length})
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#046BD2] animate-spin" />
          </div>
        ) : enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                        {course.target_class || course.category}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Active Access
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {course.title}
                    </h3>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-[#046BD2]" />
                        <span>{enr.batch?.name}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {enr.batch?.schedule_description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Course Completion</span>
                        <span>{progress.percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-[#046BD2] rounded-full transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {progress.completedCount} of {progress.totalCount} lessons completed
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <Link
                      href={`/dashboard/courses/${course.slug}/learn`}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Continue Learning</span>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Choose Your Target Class & Start Learning</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select a course below to view batch timings and enroll with instant access.
                </p>
              </div>
              <Link
                href="/dashboard/courses"
                className="px-4 py-2 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs shadow-sm self-start sm:self-auto transition"
              >
                View All Courses
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.allCourses || []).slice(0, 3).map((course: any) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-slate-200 p-4 hover:border-[#046BD2] hover:shadow-md transition flex flex-col justify-between space-y-3 bg-slate-50/50"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                      {course.target_class || course.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {course.subtitle || course.description}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-black text-slate-900">₹{course.price}</span>
                      <span className="text-slate-500 text-[11px]">{course.instructor_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      href={`/checkout/${course.slug}`}
                      className="flex-1 py-2 px-3 rounded-lg font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition text-center shadow-sm"
                    >
                      Enroll Now
                    </Link>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="py-2 px-2.5 rounded-lg font-bold text-xs text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Upcoming Live Classes & Announcements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Live Classes */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-600" />
              <span>Upcoming Live YouTube Sessions</span>
            </h2>
            <Link
              href="/dashboard/live"
              className="text-xs font-bold text-[#046BD2] hover:underline"
            >
              All Sessions →
            </Link>
          </div>

          <div className="space-y-3">
            {liveClasses.length > 0 ? (
              liveClasses.map((lc: any) => (
                <div
                  key={lc.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      {lc.status === 'live' ? 'Live Now' : 'Scheduled Live'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Faculty: {lc.instructor_name}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {lc.title}
                  </h4>

                  <p className="text-xs text-slate-600 line-clamp-1">{lc.description}</p>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(lc.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>

                    <Link
                      href="/dashboard/live"
                      className="text-xs font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                    >
                      <span>Join / Stream Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No upcoming live sessions scheduled at this moment.</p>
            )}
          </div>
        </div>

        {/* Announcements Notice Board */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Important Announcements</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  URGENT
                </span>
                <span className="text-[10px] text-slate-400">Today</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                Bilingual Biology Numerical & Diagram Special Session
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Shekhar Sir will cover Genetics & Reproduction numericals live today at 6:00 PM.
                Download the PDF diagram notes before joining the class.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  ANNOUNCEMENT
                </span>
                <span className="text-[10px] text-slate-400">Yesterday</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                Weekly Mock Test 01 Available in All Tests Section
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Chapter 1 & 2 full 50 marks mock test has been published with instant scoring
                and solution review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
