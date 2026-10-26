'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Course, Batch, Module, Lesson } from '@/lib/types';
import {
  Clock,
  Calendar,
  Users,
  CheckCircle,
  FileText,
  Video,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  AlertCircle,
  Lock,
  X,
  Play,
} from 'lucide-react';
import { YouTubePlayer } from '@/components/ui/YouTubePlayer';

export function CourseDetailsClient({
  course,
  batches,
  curriculum,
}: {
  course: Course;
  batches: Batch[];
  curriculum: (Module & { lessons: Lesson[] })[];
}) {
  const router = useRouter();

  // Selected batch state - default to first open batch if available
  const firstOpenBatch = batches.find((b) => b.enrollment_open);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    firstOpenBatch ? firstOpenBatch.id : batches[0]?.id || ''
  );

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    [curriculum[0]?.id || '']: true,
  });

  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

  const firstFreeLesson = curriculum
    .flatMap((m) => m.lessons)
    .find((l) => l.is_free_preview) || curriculum[0]?.lessons[0];

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const discountPercent =
    course.original_price > course.price
      ? Math.round(
          ((course.original_price - course.price) / course.original_price) * 100
        )
      : 0;

  const totalLessons = curriculum.reduce((acc, m) => acc + m.lessons.length, 0);

  const handleEnrollClick = () => {
    if (!selectedBatchId) {
      alert('Please select a batch schedule to continue');
      return;
    }
    router.push(`/checkout/${course.slug}?batchId=${selectedBatchId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs font-semibold text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-slate-900">Courses</Link>
          <span>/</span>
          <span className="text-slate-900 truncate max-w-xs">{course.title}</span>
        </nav>

        {/* Top Hero Overview Banner */}
        <div className="bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {course.target_class}
                </span>
                <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {course.category}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Verified Curriculum
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {course.subtitle}
              </p>

              {/* Meta Stats Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Faculty: <strong className="text-white">{course.instructor_name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>{course.duration_weeks} Weeks Complete Syllabus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-sky-400" />
                  <span>{totalLessons} Video Lessons</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Handwritten PDF Notes</span>
                </div>
              </div>

              {/* Action Buttons in Hero */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {firstFreeLesson && (
                  <button
                    onClick={() => setPreviewLesson(firstFreeLesson)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition shadow-lg shadow-emerald-500/25 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Watch Free Demo Lecture</span>
                  </button>
                )}
                <a
                  href="#enroll"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white transition shadow-md"
                >
                  <span>Select Batch & Enroll</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Thumbnail Preview on Desktop */}
            <div className="lg:col-span-4 hidden lg:block">
              <div
                onClick={() => firstFreeLesson && setPreviewLesson(firstFreeLesson)}
                className="relative aspect-[16/10] rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-pointer group"
              >
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover:bg-slate-950/20 transition">
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition">
                    <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Batches, Description, Curriculum, Instructor) */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. MANDATORY BATCH SELECTION PICKER */}
            <div id="enroll" className="bg-white rounded-2xl border-2 border-[#046BD2]/40 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#046BD2] uppercase tracking-wider">
                    Step 1: Choose Your Schedule
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    Available Batches & Timetables
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Select before checkout
                </span>
              </div>

              <div className="space-y-3">
                {batches.map((batch) => {
                  const isSelected = selectedBatchId === batch.id;
                  const isFull = !batch.enrollment_open;

                  return (
                    <label
                      key={batch.id}
                      className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#046BD2] bg-blue-50/50 shadow-sm'
                          : isFull
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="batch_selection"
                            value={batch.id}
                            checked={isSelected}
                            disabled={isFull}
                            onChange={() => setSelectedBatchId(batch.id)}
                            className="mt-1 h-4 w-4 text-[#046BD2] focus:ring-[#046BD2]"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">
                                {batch.name}
                              </h3>
                              {batch.enrollment_open ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Seats Available
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Batch Full
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#046BD2]" />
                              <span>{batch.schedule_description}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-500 flex-shrink-0">
                          <span className="font-semibold text-slate-800">
                            {batch.enrolled_count} / {batch.capacity}
                          </span>{' '}
                          students
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. COURSE DESCRIPTION & METHODOLOGY */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">About This Course</h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100">
                {course.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SYLLABUS & CURRICULUM */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Course Curriculum & Syllabus
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {curriculum.length} Units • {totalLessons} Lessons organized by NCERT
                  </p>
                </div>

                <button
                  onClick={() => {
                    const allOpen = Object.keys(expandedModules).length === curriculum.length;
                    if (allOpen) {
                      setExpandedModules({});
                    } else {
                      const all: Record<string, boolean> = {};
                      curriculum.forEach((m) => (all[m.id] = true));
                      setExpandedModules(all);
                    }
                  }}
                  className="text-xs font-bold text-[#046BD2] hover:underline text-left sm:text-right"
                >
                  {Object.keys(expandedModules).length === curriculum.length
                    ? 'Collapse All Units'
                    : 'Expand All Units'}
                </button>
              </div>

              <div className="space-y-4">
                {curriculum.map((module, idx) => {
                  const isOpen = !!expandedModules[module.id];

                  return (
                    <div
                      key={module.id}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100 text-left transition"
                      >
                        <div className="space-y-0.5 pr-4">
                          <span className="text-[11px] font-bold text-[#046BD2] uppercase tracking-wider block">
                            Module 0{idx + 1}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">
                            {module.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                          <span>{module.lessons.length} lessons</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 bg-white border-t border-slate-200 divide-y divide-slate-100">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 rounded-xl px-2.5 transition ${
                                lesson.is_free_preview ? 'hover:bg-emerald-50/60 cursor-pointer' : ''
                              }`}
                              onClick={() => {
                                if (lesson.is_free_preview) {
                                  setPreviewLesson(lesson);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {lesson.is_free_preview ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewLesson(lesson);
                                    }}
                                    className="p-1 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition mt-0.5 flex-shrink-0"
                                    title="Play Free Preview"
                                  >
                                    <PlayCircle className="w-5 h-5 text-emerald-600" />
                                  </button>
                                ) : (
                                  <Lock className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                                      {lesson.title}
                                    </h4>
                                    {lesson.is_free_preview && (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Play className="w-2.5 h-2.5 fill-emerald-800" />
                                        <span>Free Demo</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                    {lesson.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
                                <span>{lesson.duration_minutes}m</span>
                                {lesson.is_free_preview && (
                                  <span className="hidden sm:inline text-xs font-bold text-emerald-600">
                                    Watch →
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. INSTRUCTOR PROFILE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Course Instructor</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center font-black text-xl">
                  {course.instructor_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {course.instructor_name}
                  </h3>
                  <p className="text-xs text-slate-600">{course.instructor_title}</p>
                  <p className="text-xs text-sky-600 font-semibold mt-1">
                    Bihar Board & NEET Academic Director
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Shekhar Sir is widely recognized for his clear, diagram-driven teaching
                methodology. Over the past decade, hundreds of his students have achieved
                top ranks in Class 12 Bihar Board examinations and NEET biology sections.
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Checkout Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-xl space-y-6">
              {/* Pricing Box */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Course Fee
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    ₹{course.price.toLocaleString('en-IN')}
                  </span>
                  {course.original_price > course.price && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{course.original_price.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="bg-rose-100 text-rose-700 font-extrabold text-xs px-2 py-0.5 rounded">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Inclusive of all taxes & study notes
                </p>
              </div>

              {/* Selected Batch Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">
                  Selected Batch:
                </span>
                <span className="font-bold text-slate-900 block truncate">
                  {selectedBatch ? selectedBatch.name : 'None selected'}
                </span>
                {selectedBatch && (
                  <span className="text-slate-600 text-[11px] block">
                    {selectedBatch.schedule_description}
                  </span>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleEnrollClick}
                disabled={!selectedBatch?.enrollment_open}
                className="w-full py-4 px-6 rounded-xl font-black text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Enroll in Course</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Instant enrollment after verified UPI / Card payment</span>
                </p>
              </div>

              {/* Guarantee list */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Full syllabus coverage until board exams</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Weekly live YouTube doubt sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Accessible on Mobile, Tablet & Desktop</span>
                </div>
              </div>
            </div>
          </div>
      {/* Interactive Free Preview Video Modal */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl text-white space-y-4">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  Free Demo Lecture
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-lg">
                  {previewLesson.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewLesson(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Video Player with YouTubePlayer component */}
            <div className="p-4 sm:p-6 pt-0 space-y-4">
              <YouTubePlayer
                videoIdOrUrl={previewLesson.youtube_video_id}
                title={previewLesson.title}
                autoPlay={true}
              />

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Faculty: {course.instructor_name}</span>
                  <span className="text-slate-200 font-semibold">{previewLesson.description}</span>
                </div>

                <button
                  onClick={() => {
                    setPreviewLesson(null);
                    handleEnrollClick();
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white transition shadow-md whitespace-nowrap self-start sm:self-auto"
                >
                  Enroll Now to Unlock All Classes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
