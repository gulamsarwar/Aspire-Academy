'use client';

import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
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
  AlertTriangle,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'u0000000-0000-0000-0000-000000000001';

  const enrollments = db.getStudentEnrollments(studentId);
  const liveClasses = db.liveClasses.filter((lc) => lc.status === 'scheduled' || lc.status === 'live');
  const announcements = db.announcements;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Greeting Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Academic Session 2026-27</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Welcome back, {user ? user.full_name : 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Continue where you left off. Watch interactive video lectures, download chapter
            diagram notes, and join upcoming live doubt classes.
          </p>
        </div>
      </div>

      {/* 2. Key Stats Summary */}
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
            <span className="text-xs font-semibold text-slate-500 block">Upcoming Live Classes</span>
            <span className="text-2xl font-black text-slate-900">{liveClasses.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Account Status</span>
            <span className="text-base font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Verified Student
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
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

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments.map((enr) => {
              const course = enr.course;
              if (!course) return null;

              const progress = db.getStudentProgressForCourse(studentId, course.id);

              return (
                <div
                  key={enr.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                        {course.target_class}
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

                  <div className="pt-4 border-t border-slate-100">
                    <Link
                      href={`/dashboard/courses/${course.slug}/learn`}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Continue Learning</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No active enrollments yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore our Bihar Board & NEET courses, pick a batch timing, and start learning.
            </p>
            <Link
              href="/courses"
              className="inline-block py-2 px-4 rounded-xl bg-[#046BD2] text-white font-bold text-xs shadow-sm"
            >
              Browse Course Catalog
            </Link>
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
            {liveClasses.map((lc) => (
              <div
                key={lc.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    Scheduled Live
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
                    <span>View Stream Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Notice Board */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Important Announcements</span>
          </h2>

          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      a.priority === 'urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {a.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(a.published_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {a.title}
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
