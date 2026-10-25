'use client';

import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { useAuth } from '@/components/auth/AuthContext';
import { FileText, Download, Eye, BookOpen, Lock } from 'lucide-react';

export default function StudyMaterialsPage() {
  const { user, role } = useAuth();
  const studentId = user?.id || 'u0000000-0000-0000-0000-000000000001';

  const enrollments = db.getStudentEnrollments(studentId);
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  // Extract all lessons with material_path
  const allLessons = db.lessons.filter((l) => l.material_path);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Authorized Study Materials & PDF Notes
        </h1>
        <p className="text-xs text-slate-500">
          Handwritten diagrams, chapter notes, and formula sheets for your enrolled subjects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allLessons.map((lesson) => {
          const module = db.modules.find((m) => m.id === lesson.module_id);
          const course = db.getCourseById(module?.course_id || '');
          const isAccessible =
            enrolledCourseIds.has(course?.id || '') ||
            lesson.is_free_preview ||
            role === 'admin';

          return (
            <div
              key={lesson.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                    {course?.category}
                  </span>
                  {isAccessible ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Authorized Access
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {lesson.material_name || `${lesson.title} Notes`}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {course?.title}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {lesson.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {isAccessible ? (
                  <button
                    onClick={() =>
                      alert(`Downloading authorized PDF: ${lesson.material_name}`)
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                ) : (
                  <Link
                    href={`/courses/${course?.slug}#enroll`}
                    className="text-xs font-bold text-[#046BD2] hover:underline"
                  >
                    Enroll to Unlock →
                  </Link>
                )}

                <span className="text-[10px] text-slate-400 font-medium">
                  {module?.title.split(':')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
