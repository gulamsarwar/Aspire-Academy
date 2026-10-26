'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { FileText, Download, BookOpen, Lock, CheckCircle2, Loader2 } from 'lucide-react';

export default function StudyMaterialsPage() {
  const { user, role } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        setLoading(true);
        const studentId = user?.id || '';
        const url = studentId ? `/api/student/dashboard?studentId=${encodeURIComponent(studentId)}` : '/api/student/dashboard';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load study materials');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load materials:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, [user?.id]);

  const handleDownload = async (mat: any) => {
    try {
      setDownloadingId(mat.id);
      const studentId = user?.id || '';

      // 1. Record download in database
      await fetch('/api/student/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          lesson_id: mat.id,
          material_name: mat.materialName,
          material_path: mat.materialPath,
        }),
      });

      // 2. Open or download the material file
      window.open(mat.materialPath, '_blank');
    } catch (err) {
      console.error('Download tracking failed:', err);
      window.open(mat.materialPath, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const materials = data?.materials || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          PDF Bank & Authorized Study Notes
        </h1>
        <p className="text-xs text-slate-500">
          Handwritten diagrams, chapter notes, and formula sheets for your enrolled subjects.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse h-52" />
          ))}
        </div>
      ) : materials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((lesson: any) => {
            const isAccessible = lesson.isAccessible || role === 'admin';

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                      {lesson.courseCategory || 'Academic Note'}
                    </span>
                    {isAccessible ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Authorized Access
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Course Enrollment Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">
                        {lesson.materialName}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {lesson.courseTitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    Lesson Reference: {lesson.lessonTitle}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isAccessible ? (
                    <button
                      onClick={() => handleDownload(lesson)}
                      disabled={downloadingId === lesson.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-sm disabled:opacity-50"
                    >
                      {downloadingId === lesson.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download PDF</span>
                    </button>
                  ) : (
                    <Link
                      href="/courses"
                      className="text-xs font-bold text-[#046BD2] hover:underline"
                    >
                      Enroll to Unlock →
                    </Link>
                  )}

                  <span className="text-[10px] text-slate-400 font-medium">
                    Verified Notes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No PDF Notes Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            PDF notes and diagram sheets will appear here once published by faculty.
          </p>
        </div>
      )}
    </div>
  );
}
