'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  Loader2,
  Lock,
} from 'lucide-react';

export default function AllClassesPage() {
  const { user, role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [updatingLessonId, setUpdatingLessonId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (!user?.id) {
          setData({ enrollments: [], progressList: [] });
          return;
        }
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user.id)}`);
        if (!res.ok) throw new Error('Failed to load dashboard data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load classes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const enrollments = data?.enrollments || [];
  const enrolledCourseIds = new Set(enrollments.map((e: any) => e.course_id));
  const progressList = data?.progressList || [];

  // Toggle completion
  const handleToggleCompletion = async (courseId: string, lessonId: string, currentCompleted: boolean) => {
    if (!user?.id) return;
    try {
      setUpdatingLessonId(lessonId);
      const studentId = user.id;
      const res = await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId,
          lesson_id: lessonId,
          completed: !currentCompleted,
        }),
      });
      if (res.ok) {
        // Refresh local progress state
        const dashRes = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(studentId)}`);
        const json = await dashRes.json();
        setData(json);
      }
    } catch (err) {
      console.error('Progress update error:', err);
    } finally {
      setUpdatingLessonId(null);
    }
  };

  // Extract all lessons from all enrolled courses
  const allLessons: any[] = [];
  enrollments.forEach((enr: any) => {
    const course = enr.course;
    const progress = progressList.find((p: any) => p.courseId === course?.id);
    const completedSet = new Set(progress?.completedLessonIds || []);

    course?.modules?.forEach((mod: any) => {
      mod?.lessons?.forEach((les: any) => {
        allLessons.push({
          ...les,
          courseId: course.id,
          courseTitle: course.title,
          courseSlug: course.slug,
          moduleTitle: mod.title,
          isCompleted: completedSet.has(les.id),
        });
      });
    });
  });

  const filteredLessons = allLessons.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = selectedCourseId === 'all' || l.courseId === selectedCourseId;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            All Video Classes & Lectures
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive curriculum lectures, syllabus chapters, and interactive numericals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search lectures or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2] w-48 sm:w-64 bg-white"
            />
          </div>

          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#046BD2]"
          >
            <option value="all">All Enrolled Courses</option>
            {enrollments.map((enr: any) => (
              <option key={enr.course_id} value={enr.course_id}>
                {enr.course?.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        </div>
      ) : filteredLessons.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {filteredLessons.map((les) => (
              <div
                key={les.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => handleToggleCompletion(les.courseId, les.id, les.isCompleted)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition ${
                      les.isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'border-2 border-slate-200 text-transparent hover:border-[#046BD2]'
                    }`}
                    title="Mark as completed"
                  >
                    {updatingLessonId === les.id ? (
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                        {les.moduleTitle}
                      </span>
                      {les.isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Completed
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {les.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Course: {les.courseTitle}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {les.duration_minutes || 45} mins
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/dashboard/courses/${les.courseSlug}/learn`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-sm"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Watch Class</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Classes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {enrollments.length === 0
              ? 'Enroll in a course to access curriculum video lectures.'
              : 'No lectures matched your search filter.'}
          </p>
          {enrollments.length === 0 && (
            <Link
              href="/courses"
              className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2]"
            >
              Browse Courses
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
