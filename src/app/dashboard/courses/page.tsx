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
  Sparkles,
  Users,
  Video,
  FileText,
  Search,
} from 'lucide-react';

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, isAuthReady } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'class12' | 'class11' | 'neet' | 'class10'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthReady) return;

    const activeUser =
      user ||
      (typeof window !== 'undefined' && localStorage.getItem('aspire_user')
        ? JSON.parse(localStorage.getItem('aspire_user')!)
        : null);

    if (!activeUser) {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent('/dashboard/courses');
      return;
    }

    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(activeUser.id)}`);
        if (!res.ok) throw new Error('Failed to load courses');
        const json = await res.json();

        // Merge with local client storage cache for instant offline/reload sync
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
        <p className="text-xs font-semibold text-slate-500">Loading your academic courses & enrollments...</p>
      </div>
    );
  }

  const enrollments = data?.enrollments || [];
  const progressList = data?.progressList || [];
  const allCourses = data?.allCourses || [];
  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));

  // Filter available courses
  const filteredCourses = allCourses.filter((course: any) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.target_class && course.target_class.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'class12') return course.target_class?.includes('12');
    if (activeTab === 'class11') return course.target_class?.includes('11');
    if (activeTab === 'neet') return course.category?.toLowerCase().includes('neet') || course.title?.toLowerCase().includes('neet');
    if (activeTab === 'class10') return course.target_class?.includes('10');
    return true;
  });

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Aspire Academy • Academic Course Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Academic Courses & Study Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Access your enrolled video lectures, chapter diagrams, test series, or browse available Bihar Board & NEET batches.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition border border-white/20"
          >
            Dashboard Home
          </Link>
          <a
            href="#available-courses"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white transition shadow-md flex items-center gap-1.5"
          >
            <span>Browse All Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. SECTION: My Enrolled Courses */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#046BD2]" />
            <span>My Enrolled Courses ({enrollments.length})</span>
          </h2>
          {enrollments.length > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full Study Room Access</span>
            </span>
          )}
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
                  className="bg-white rounded-2xl border-2 border-blue-500/30 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                      <img
                        src={course.thumbnail_url || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-[#0B192C]/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {course.target_class || course.category}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
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
                          <span>{enr.batch?.name || 'Assigned Batch Schedule'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {enr.batch?.schedule_description || 'Daily live sessions & recorded backup'}
                        </p>
                      </div>

                      {/* Progress tracking */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Learning Progress</span>
                          <span className="font-bold text-[#046BD2]">{progress.percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-[#046BD2] rounded-full transition-all duration-500"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{progress.completedCount} lessons completed</span>
                          <span>Faculty: {course.instructor_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <Link
                      href={`/dashboard/courses/${course.slug}/learn`}
                      className="flex-1 py-3 px-4 rounded-xl font-black text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Open Study Room</span>
                    </Link>
                    <Link
                      href="/dashboard/tests"
                      className="py-3 px-3.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Tests
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-50/60 to-white rounded-3xl border-2 border-dashed border-blue-200 p-8 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-[#046BD2] mx-auto opacity-80" />
            <h3 className="font-bold text-slate-900 text-base">You haven't enrolled in any courses yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Explore our comprehensive Bihar Board & NEET courses below, pick your batch schedule, and enroll directly with instant access!
            </p>
          </div>
        )}
      </div>

      {/* 3. SECTION: Available Academic Courses (Explore & Enroll) */}
      <div id="available-courses" className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Available Academic Courses (Explore & Enroll)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pick your target class, select a batch schedule, and start interactive learning with Shekhar Sir.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search course or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#046BD2]"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Courses' },
            { id: 'class12', label: 'Class 12th' },
            { id: 'class11', label: 'Class 11th' },
            { id: 'neet', label: 'NEET Dropper' },
            { id: 'class10', label: 'Class 10th' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-[#046BD2] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course: any) => {
            const isEnrolled = enrolledCourseIds.has(course.id);

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
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

                    {isEnrolled && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enrolled</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.subtitle || course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">
                        Faculty: {course.instructor_name}
                      </span>
                      <span>{course.duration_weeks || 40} Weeks</span>
                    </div>

                    {/* Pricing */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Batch Fee</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900">
                            ₹{course.price}
                          </span>
                          {course.original_price > course.price && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{course.original_price}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded">
                        UPI / Razorpay Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center gap-2">
                  {isEnrolled ? (
                    <Link
                      href={`/dashboard/courses/${course.slug}/learn`}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Already Enrolled • Open Study Room</span>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/checkout/${course.slug}`}
                        className="flex-1 py-3 px-4 rounded-xl font-black text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                      >
                        <span>Enroll Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="py-3 px-3 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Syllabus
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
