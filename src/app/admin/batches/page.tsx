'use client';

import React, { useState } from 'react';
import { db } from '@/lib/data/mock-db';
import { Batch } from '@/lib/types';
import {
  Calendar,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([...db.batches]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Batch Form State
  const [selectedCourseId, setSelectedCourseId] = useState(db.courses[0]?.id || '');
  const [name, setName] = useState('');
  const [scheduleDescription, setScheduleDescription] = useState('Mon, Wed, Fri — 05:00 PM to 06:30 PM');
  const [capacity, setCapacity] = useState(150);
  const [instructor, setInstructor] = useState('Shekhar Sir');

  const toggleEnrollment = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    batch.enrollment_open = !batch.enrollment_open;
    setBatches([...batches]);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = db.addBatch({
      course_id: selectedCourseId,
      name,
      schedule_description: scheduleDescription,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      capacity: Number(capacity),
      enrollment_open: true,
      instructor_name: instructor,
    });

    setBatches([created, ...batches]);
    setShowAddModal(false);
    setName('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Batch & Schedule Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure timetable slots, student capacities, and admissions availability.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Batch</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
              {batches.map((batch) => {
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create New Batch</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
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
                  {db.courses.map((c) => (
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
                  placeholder="e.g. Evening Topper Batch (Mon, Wed, Fri)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Weekly Timetable Schedule</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tue, Thu, Sat — 06:00 PM to 07:30 PM IST"
                  value={scheduleDescription}
                  onChange={(e) => setScheduleDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Seat Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Faculty In-Charge</label>
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
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
