'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Course, Module, Lesson, LiveClass, Announcement } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/data/mock-db';
import {
  PlayCircle,
  CheckCircle2,
  Lock,
  FileText,
  Download,
  Video,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export function CoursePlayerClient({
  course,
  curriculum,
  liveClasses,
  announcements,
}: {
  course: Course;
  curriculum: (Module & { lessons: Lesson[] })[];
  liveClasses: LiveClass[];
  announcements: Announcement[];
}) {
  const { user, role } = useAuth();
  const studentId = user?.id || 'u0000000-0000-0000-0000-000000000001';

  // Check enrollment
  const isEnrolled = db.isStudentEnrolled(studentId, course.id) || role === 'admin';

  // All lessons flat array for navigation
  const allLessons = curriculum.flatMap((m) => m.lessons);

  // Active lesson state
  const [activeLessonId, setActiveLessonId] = useState<string>(
    allLessons[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'live' | 'announcements'>('overview');

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  const activeLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);

  // Student progress tracker
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    const progress = db.getStudentProgressForCourse(studentId, course.id);
    const map: Record<string, boolean> = {};
    progress.completedLessonIds.forEach((id) => (map[id] = true));
    return map;
  });

  const toggleComplete = (lessonId: string) => {
    const updated = db.toggleLessonProgress(studentId, lessonId);
    setCompletedLessons((prev) => ({
      ...prev,
      [lessonId]: updated,
    }));
  };

  const handleNextLesson = () => {
    if (activeLessonIndex < allLessons.length - 1) {
      setActiveLessonId(allLessons[activeLessonIndex + 1].id);
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonId(allLessons[activeLessonIndex - 1].id);
    }
  };

  // 1. BLOCKED ACCESS LOCK SCREEN (If not enrolled and not free preview)
  if (!isEnrolled && !activeLesson?.is_free_preview) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            Enrollment Verification Required
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Course Content is Protected
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            You do not have an active enrollment for <strong>{course.title}</strong>. Paid
            video lessons, batch discussions, and handwritten PDF notes are restricted to
            verified enrolled students.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/courses/${course.slug}#enroll`}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Select Batch & Enroll Now (₹{course.price})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = !!completedLessons[activeLesson?.id || ''];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Link href="/dashboard/courses" className="hover:text-slate-900">
              ← My Courses
            </Link>
            <span>/</span>
            <span className="text-slate-800 truncate max-w-xs">{course.title}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {activeLesson?.title || 'Course Lesson'}
          </h1>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleComplete(activeLesson.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Completed' : 'Mark as Complete'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Left, Lessons Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Video Embed, Tabs, Notes */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Responsive YouTube Video Player */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
            {activeLesson?.youtube_video_id ? (
              <iframe
                title={activeLesson.title}
                src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtube_video_id}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <Video className="w-12 h-12 text-slate-600" />
                <p className="text-xs">Video content loading...</p>
              </div>
            )}
          </div>

          {/* Navigation Controls below Player */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={handlePrevLesson}
              disabled={activeLessonIndex === 0}
              className="px-4 py-2 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Lesson</span>
            </button>

            <span className="text-xs font-semibold text-slate-500">
              Lesson {activeLessonIndex + 1} of {allLessons.length}
            </span>

            <button
              onClick={handleNextLesson}
              disabled={activeLessonIndex === allLessons.length - 1}
              className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition shadow-sm"
            >
              <span>Next Lesson</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. Interactive Study Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-3.5 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-[#046BD2] text-[#046BD2] bg-blue-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Lesson Overview
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-5 py-3.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'notes'
                    ? 'border-[#046BD2] text-[#046BD2] bg-blue-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Study Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`px-5 py-3.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'live'
                    ? 'border-[#046BD2] text-[#046BD2] bg-blue-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-500" />
                <span>Related Live Classes ({liveClasses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`px-5 py-3.5 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'announcements'
                    ? 'border-[#046BD2] text-[#046BD2] bg-blue-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                <span>Batch Notices</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    {activeLesson?.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {activeLesson?.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Duration: <strong>{activeLesson?.duration_minutes} Minutes</strong></span>
                    <span>Instructor: <strong>{course.instructor_name}</strong></span>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">
                    Downloadable Materials for this Lesson
                  </h3>
                  {activeLesson?.material_path ? (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#046BD2] flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {activeLesson.material_name || 'Handwritten Lesson Notes.pdf'}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            NCERT High-Yield Diagrams & Solved PYQs
                          </p>
                        </div>
                      </div>

                      <a
                        href="#download-pdf"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Downloading: ${activeLesson.material_name || 'Notes.pdf'}`);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No standalone PDF attachment for this specific concept. Full chapter notes
                      are accessible in the Study Materials tab.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'live' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Upcoming YouTube Live Doubt Sessions
                  </h3>
                  {liveClasses.length > 0 ? (
                    liveClasses.map((lc) => (
                      <div
                        key={lc.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            {lc.status.toUpperCase()}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            {lc.title}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            {new Date(lc.scheduled_at).toLocaleString('en-IN')}
                          </p>
                        </div>

                        <Link
                          href="/dashboard/live"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Stream</span>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      No live sessions scheduled this week. Check back soon.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'announcements' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Batch Notices</h3>
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                    >
                      <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Curriculum Drawer / Course Structure */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Course Curriculum</h3>
            <p className="text-[11px] text-slate-500">
              {allLessons.length} Lessons • Toggle completion as you study
            </p>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {curriculum.map((module, mIdx) => (
              <div key={module.id} className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Unit 0{mIdx + 1}: {module.title}
                </span>

                <div className="space-y-1.5">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLessonId;
                    const done = !!completedLessons[lesson.id];

                    return (
                      <div
                        key={lesson.id}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-2 ${
                          isActive
                            ? 'border-[#046BD2] bg-blue-50/70 font-bold shadow-sm'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                        }`}
                        onClick={() => setActiveLessonId(lesson.id)}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComplete(lesson.id);
                            }}
                            className="flex-shrink-0"
                            title={done ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 ${
                                done
                                  ? 'text-emerald-600 fill-emerald-100'
                                  : 'text-slate-300 hover:text-slate-400'
                              }`}
                            />
                          </button>
                          <span className="truncate">{lesson.title}</span>
                        </div>

                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {lesson.duration_minutes}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
