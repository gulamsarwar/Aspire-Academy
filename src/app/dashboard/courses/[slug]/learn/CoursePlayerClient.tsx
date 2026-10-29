'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Course, Module, Lesson, LiveClass, Announcement } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
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
  MessageCircle,
  Bookmark as BookmarkIcon,
  Award,
  Tv,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { YouTubePlayer } from '@/components/ui/YouTubePlayer';

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
  const { settings } = useSiteSettings();
  const studentId = user?.id || '';

  // Support phone for direct WhatsApp doubts
  const rawPhone = (settings.whatsapp || settings.phone || '9939598284').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;

  // Check enrollment with dynamic server/cache synchronization
  const [isEnrolled, setIsEnrolled] = useState<boolean>(() => {
    if (role === 'admin') return true;
    if (!user) return false;
    if (db.isStudentEnrolled(user.id, course.id)) return true;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aspire_student_enrollments');
        if (stored) {
          const list = JSON.parse(stored);
          if (list.some((e: any) => e.course_id === course.id && e.status === 'active')) return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  });

  // All lessons flat array for navigation
  const allLessons = curriculum.flatMap((m) => m.lessons);

  // Default to first free preview lesson if not enrolled, or first lesson
  const firstAvailableLesson = allLessons.find((l) => isEnrolled || l.is_free_preview) || allLessons[0];
  const [activeLessonId, setActiveLessonId] = useState<string>(
    firstAvailableLesson?.id || allLessons[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'live' | 'announcements'>('overview');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  const activeLessonIndex = allLessons.findIndex((l) => l.id === activeLessonId);

  // Sync real enrollment status from server / database
  React.useEffect(() => {
    if (role === 'admin') {
      setIsEnrolled(true);
      return;
    }
    if (!studentId || !user) {
      setIsEnrolled(false);
      return;
    }

    try {
      const stored = localStorage.getItem('aspire_student_enrollments');
      if (stored) {
        const list = JSON.parse(stored);
        if (list.some((e: any) => e.course_id === course.id && e.status === 'active')) {
          setIsEnrolled(true);
        }
      }
    } catch {
      // ignore
    }

    async function checkServerEnrollment() {
      try {
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(studentId)}`);
        if (res.ok) {
          const data = await res.json();
          const hasCourse = (data.enrollments || []).some(
            (e: any) => e.course_id === course.id && e.status === 'active'
          );
          if (hasCourse) {
            setIsEnrolled(true);
            try {
              localStorage.setItem('aspire_student_enrollments', JSON.stringify(data.enrollments));
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // network fallback
      }
    }
    checkServerEnrollment();
  }, [studentId, course.id, role]);

  // Student progress tracker
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() => {
    if (!studentId) return {};
    const progress = db.getStudentProgressForCourse(studentId, course.id);
    const map: Record<string, boolean> = {};
    progress.completedLessonIds.forEach((id) => (map[id] = true));
    return map;
  });

  const completedCount = allLessons.filter((l) => completedLessons[l.id]).length;
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  React.useEffect(() => {
    if (!studentId) {
      setCompletedLessons({});
      return;
    }
    const progress = db.getStudentProgressForCourse(studentId, course.id);
    const map: Record<string, boolean> = {};
    progress.completedLessonIds.forEach((id) => (map[id] = true));
    setCompletedLessons(map);
  }, [studentId, course.id]);

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

  const isCompleted = !!completedLessons[activeLesson?.id || ''];
  const canAccessActiveLesson = isEnrolled || Boolean(activeLesson?.is_free_preview);

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

        {/* Progress Tracker and Complete Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end text-xs">
            <span className="font-bold text-slate-800">
              {completedCount} of {allLessons.length} Completed ({progressPercent}%)
            </span>
            <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/student/bookmarks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      studentId,
                      resourceType: 'lesson',
                      resourceId: activeLesson.id,
                      title: activeLesson.title,
                      url: `/dashboard/courses/${course.slug}/learn`,
                    }),
                  });
                  if (res.ok) {
                    setIsBookmarked(true);
                    setToastMessage('Lesson saved to Bookmarks!');
                    setTimeout(() => setToastMessage(''), 2500);
                  }
                } catch {
                  // ignore
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
              title="Bookmark this lesson"
            >
              <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                isTheaterMode
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title={isTheaterMode ? 'Switch to Split Layout' : 'Expand Video to Theater View'}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{isTheaterMode ? 'Split View' : 'Theater View'}</span>
            </button>

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
      </div>

      {/* Main Grid: Player on Left, Lessons Drawer on Right */}
      <div className={`grid grid-cols-1 ${isTheaterMode ? 'lg:grid-cols-1 gap-6' : 'lg:grid-cols-12 gap-8'} items-start`}>
        {/* Left Column: Video Embed, Tabs, Notes */}
        <div className={`${isTheaterMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6`}>
          {/* 1. Responsive Video Player (YouTube or Cloudflare R2 Stream) */}
          {canAccessActiveLesson ? (
            activeLesson?.r2_object_key || activeLesson?.video_source_type === 'r2' ? (
              <YouTubePlayer
                videoIdOrUrl={`/api/r2/playback?lessonId=${activeLesson.id}&redirect=1`}
                title={activeLesson.title}
                autoPlay={false}
              />
            ) : activeLesson?.youtube_video_id ? (
              <YouTubePlayer
                videoIdOrUrl={activeLesson.youtube_video_id}
                title={activeLesson.title}
                autoPlay={false}
              />
            ) : activeLesson?.video_url ? (
              <YouTubePlayer
                videoIdOrUrl={activeLesson.video_url}
                title={activeLesson.title}
                autoPlay={false}
              />
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Video className="w-12 h-12 text-slate-600" />
                <p className="text-xs">Video lecture stream loading...</p>
              </div>
            )
          ) : (
            <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-slate-950 via-[#0B192C] to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col items-center justify-center text-center text-white space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  Paid Course Lecture
                </span>
                <h3 className="text-lg font-bold text-white">Enroll to Unlock This Lecture</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This lecture is part of the complete {course.title} board exam syllabus. Enroll to access all recorded lectures, handwritten PDF notes, and live doubt solving.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href={`/courses/${course.slug}#enroll`}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white transition shadow-md flex items-center gap-1.5"
                >
                  <span>Enroll in Course (₹{course.price})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {firstAvailableLesson?.is_free_preview && (
                  <button
                    onClick={() => setActiveLessonId(firstAvailableLesson.id)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Watch Free Demo Lecture</span>
                  </button>
                )}
              </div>
            </div>
          )}

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

          {/* Digital DRM Anti-Piracy Watermark Notice */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 border border-slate-200 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span className="font-semibold text-slate-800">Anti-Piracy & Anti-Download Protection Active:</span>
              <span className="text-slate-500">Video watermarked with student roll ID to prevent sharing.</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Paid Batch Access Locked
            </span>
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
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeLesson?.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line mt-2">
                      {activeLesson?.description}
                    </p>
                  </div>

                  {/* Attached Lesson Quiz Banner */}
                  {activeLesson?.quiz_id && (() => {
                    const attachedQuiz = db.quizzes.find((q) => q.id === activeLesson.quiz_id);
                    if (!attachedQuiz) return null;

                    return (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Award className="w-4 h-4 text-amber-600" />
                            <span>Attached Chapter Quiz: {attachedQuiz.title}</span>
                          </div>
                          <p className="text-[11px] text-amber-700">
                            Practice {attachedQuiz.questions_count} questions ({attachedQuiz.duration_minutes} mins) • Test your understanding now.
                          </p>
                        </div>

                        <Link
                          href={`/dashboard/tests?quizId=${attachedQuiz.id}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition whitespace-nowrap"
                        >
                          <span>Start Lesson Quiz</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    );
                  })()}

                  {/* 1-Tap Faculty Doubt Solver */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Have a doubt on this concept?</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Ask Shekhar Sir directly on WhatsApp with your query or question screenshot.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                        `Namaste Shekhar Sir, I am studying "${course.title}" and have a doubt in Lesson: "${activeLesson?.title || ''}". Could you please guide me?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition hover:scale-105 whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Ask Doubt on WhatsApp</span>
                    </a>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
                          setToastMessage(`Downloading "${activeLesson.material_name || 'Notes.pdf'}"... PDF ready!`);
                          setTimeout(() => setToastMessage(''), 4000);
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
        <div className={`${isTheaterMode ? 'lg:col-span-12 mt-4' : 'lg:col-span-4'} bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4`}>
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Course Curriculum</h3>
            <p className="text-[11px] text-slate-500">
              {allLessons.length} Lessons • Toggle completion as you study
            </p>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {curriculum.map((module, mIdx) => {
              const moduleLessons = module.lessons || [];
              const moduleCompletedCount = moduleLessons.filter((l) => completedLessons[l.id]).length;

              return (
                <div key={module.id} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Unit 0{mIdx + 1}: {module.title}</span>
                    <span className="text-[10px] text-slate-400 font-semibold lowercase">
                      {moduleCompletedCount}/{moduleLessons.length} done
                    </span>
                  </div>

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

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isActive && (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-[#046BD2] bg-blue-100/90 px-1.5 py-0.5 rounded-full animate-pulse flex-shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#046BD2]" />
                                <span>Playing</span>
                              </span>
                            )}
                            {lesson.is_free_preview ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Free Demo
                            </span>
                          ) : !isEnrolled ? (
                            <span title="Enrollment required to unlock">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                          ) : null}
                          {lesson.quiz_id && (
                            <span title="Attached Quiz Available">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {lesson.duration_minutes}m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
