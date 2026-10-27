'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { Batch } from '@/lib/types';
import {
  Calendar,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  X,
  Filter,
} from 'lucide-react';

export default function AdminBatchesPage() {
  const courses = db.courses;
  const [batches, setBatches] = useState<Batch[]>([...db.batches]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCourseId, setFilterCourseId] = useState<string>('all');
  const [successToast, setSuccessToast] = useState('');

  // New Batch Form State
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [name, setName] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('Mon, Wed, Fri — 05:00 PM to 06:30 PM');
  const [capacity, setCapacity] = useState(150);
  const [instructor, setInstructor] = useState('Shekhar Sir');

  // Handle URL query parameter ?courseId=...
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get('courseId');
      if (cid && courses.some((c) => c.id === cid)) {
        setFilterCourseId(cid);
        setSelectedCourseId(cid);
      }
    }
  }, [courses]);

  const toggleEnrollment = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    batch.enrollment_open = !batch.enrollment_open;
    setBatches([...batches]);
    setSuccessToast(`Admissions ${batch.enrollment_open ? 'opened' : 'closed'} for ${batch.name}.`);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = db.addBatch({
      course_id: selectedCourseId,
      name: name.trim(),
      schedule_description: scheduleDescription.trim(),
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      capacity: Number(capacity) || 150,
      enrollment_open: true,
      instructor_name: instructor.trim() || 'Shekhar Sir',
    });

    setBatches([created, ...batches]);
    setShowAddModal(false);
    setName('');
    setSuccessToast(`Batch "${created.name}" created successfully!`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Filtered batches
  const displayedBatches =
    filterCourseId === 'all'
      ? batches
      : batches.filter((b) => b.course_id === filterCourseId);

  const activeFilteredCourse = courses.find((c) => c.id === filterCourseId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-1.5 text-[#046BD2] hover:underline font-extrabold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Course Management</span>
            </Link>
            {activeFilteredCourse && (
              <>
                <span>/</span>
                <span className="text-slate-800 font-extrabold truncate max-w-xs">
                  {activeFilteredCourse.title}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Batch & Schedule Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Configure timetable slots, student seat capacities, and admission availability.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md shadow-blue-500/25 transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Batch</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Filter by Course Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter by Course:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-900 focus:outline-none focus:border-[#046BD2] max-w-sm truncate"
          >
            <option value="all">All Courses ({batches.length} total batches)</option>
            {courses.map((c) => {
              const count = batches.filter((b) => b.course_id === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.title} ({count} batches)
                </option>
              );
            })}
          </select>

          {filterCourseId !== 'all' && (
            <button
              onClick={() => setFilterCourseId('all')}
              className="text-xs font-bold text-[#046BD2] hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Mobile Batches Cards (< 768px) */}
      <div className="md:hidden space-y-3">
        {displayedBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            No batches found for this course. Click &ldquo;Add New Batch&rdquo; to create one!
          </div>
        ) : (
          displayedBatches.map((batch) => {
            const course = db.getCourseById(batch.course_id);

            return (
              <div
                key={batch.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        batch.enrollment_open
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {batch.enrollment_open ? '● Admissions Open' : '● Admissions Closed'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {batch.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      {course?.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-[#046BD2] flex-shrink-0" />
                  <span className="font-medium text-[11px]">{batch.schedule_description}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Faculty: <strong className="text-slate-800">{batch.instructor_name || course?.instructor_name}</strong>
                  </span>
                  <span className="font-bold text-slate-900">
                    {batch.enrolled_count} / {batch.capacity} seats
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => toggleEnrollment(batch.id)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                      batch.enrollment_open
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {batch.enrollment_open ? 'Close Admissions' : 'Open Admissions'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Batches Table (>= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Batch Name & Schedule</th>
                <th className="px-6 py-4">Associated Course</th>
                <th className="px-6 py-4">Faculty</th>
                <th className="px-6 py-4">Capacity & Enrolled</th>
                <th className="px-6 py-4">Enrollment State</th>
                <th className="px-6 py-4 text-right">Toggle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedBatches.map((batch) => {
                const course = db.getCourseById(batch.course_id);

                return (
                  <tr key={batch.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <h4 className="font-bold text-slate-900 text-sm">{batch.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                        <Clock className="w-3 h-3 text-[#046BD2]" />
                        <span>{batch.schedule_description}</span>
                      </p>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-800 max-w-xs truncate">
                      {course?.title}
                    </td>

                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {batch.instructor_name || course?.instructor_name}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">
                        {batch.enrolled_count}
                      </span>
                      <span className="text-slate-400"> / {batch.capacity} seats</span>
                    </td>

                    <td className="px-6 py-4">
                      {batch.enrollment_open ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <XCircle className="w-3 h-3" /> Closed
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleEnrollment(batch.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          batch.enrollment_open
                            ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {batch.enrollment_open ? 'Close Admissions' : 'Open Admissions'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Batch</h3>
                <p className="text-xs text-slate-500">
                  Assign timetable and student capacity for a course.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Link to Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Target 2026-27 Morning Super 50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Schedule & Timing</label>
                <input
                  type="text"
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Student Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Instructor Name</label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
