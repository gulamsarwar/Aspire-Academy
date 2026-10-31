'use client';

import React, { useState } from 'react';
import { db } from '@/lib/data/mock-db';
import { Profile } from '@/lib/types';
import { CANONICAL_ADMIN_ID } from '@/lib/auth/admin';
import {
  Users,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([...db.profiles]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);

  // Manual Override Modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStudent, setOverrideStudent] = useState<Profile | null>(null);
  const [targetCourseId, setTargetCourseId] = useState(db.courses[0]?.id || '');
  const [targetBatchId, setTargetBatchId] = useState(db.batches[0]?.id || '');
  const [overrideAction, setOverrideAction] = useState<'grant' | 'revoke'>('grant');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState('');

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search))
  );

  const handleOpenOverride = (student: Profile) => {
    setOverrideStudent(student);
    setOverrideReason('');
    setOverrideError('');
    setOverrideSuccess('');
    setShowOverrideModal(true);
  };

  const handleExecuteOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setOverrideError('');
    setOverrideSuccess('');

    if (!overrideReason.trim() || overrideReason.trim().length < 5) {
      setOverrideError('A detailed reason (at least 5 characters) is required for audit logs.');
      return;
    }

    try {
      db.manualEnrollmentOverride({
        adminId: CANONICAL_ADMIN_ID, // Shekhar Sir
        studentId: overrideStudent!.id,
        courseId: targetCourseId,
        batchId: targetBatchId,
        action: overrideAction,
        reason: overrideReason,
      });

      // Also persist to Supabase & audit trail asynchronously
      fetch('/api/admin/students/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: overrideStudent!.id,
          courseId: targetCourseId,
          batchId: targetBatchId,
          action: overrideAction,
          reason: overrideReason,
        }),
      }).catch((err) => console.warn('Supabase override sync notice:', err));

      setOverrideSuccess(
        `Access successfully ${overrideAction === 'grant' ? 'granted' : 'revoked'} with audit log recorded.`
      );
      setTimeout(() => {
        setShowOverrideModal(false);
      }, 1500);
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to apply access override');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            Student Management & Access Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Search registered students, inspect enrollments, and manually grant/revoke access.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2] bg-white"
          />
        </div>
      </div>

      {/* Mobile Students Cards (< 768px) */}
      <div className="md:hidden space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            No students found matching your search.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const enrollments = db.getStudentEnrollments(student.id);
            const orders = db.orders.filter((o) => o.student_id === student.id);

            return (
              <div
                key={student.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center flex-shrink-0">
                      {student.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {student.full_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {student.email}
                      </p>
                      {student.phone && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {student.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {student.id.slice(0, 6)}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Enrolled Courses:</span>
                    <span className="font-bold text-[#046BD2]">{enrollments.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {enrollments.map((enr) => (
                      <span
                        key={enr.id}
                        className="text-[10px] font-bold bg-blue-50 text-[#046BD2] px-2 py-0.5 rounded-md border border-blue-200"
                      >
                        {enr.course?.title || enr.course?.target_class}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Orders: <strong className="text-slate-800">{orders.length}</strong>
                  </span>

                  <button
                    onClick={() => handleOpenOverride(student)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 transition inline-flex items-center gap-1 border border-amber-200"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Override Access</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Students Table (>= 768px) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Active Enrollments</th>
                <th className="px-4 py-3.5">Total Orders</th>
                <th className="px-4 py-3.5 text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const enrollments = db.getStudentEnrollments(student.id);
                const orders = db.orders.filter((o) => o.student_id === student.id);

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
                          {student.full_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">
                            {student.full_name}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400">
                            ID: {student.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-800 block font-medium">{student.email}</span>
                      <span className="text-slate-500 text-[11px]">{student.phone || 'N/A'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block">
                        {enrollments.length} Active Courses
                      </span>
                      {enrollments.map((enr) => (
                        <span
                          key={enr.id}
                          className="inline-block text-[10px] bg-blue-50 text-[#046BD2] px-1.5 py-0.5 rounded mr-1 mt-0.5"
                        >
                          {enr.course?.target_class}
                        </span>
                      ))}
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {orders.length} Orders
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenOverride(student)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 transition inline-flex items-center gap-1 border border-amber-200"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Override Access</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal with Mandatory Reason Audit */}
      {showOverrideModal && overrideStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Manual Enrollment Override
                </h3>
                <p className="text-xs text-slate-500">Student: {overrideStudent.full_name}</p>
              </div>
              <button
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {overrideError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {overrideError}
              </div>
            )}

            {overrideSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {overrideSuccess}
              </div>
            )}

            <form onSubmit={handleExecuteOverride} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course</label>
                <select
                  value={targetCourseId}
                  onChange={(e) => {
                    setTargetCourseId(e.target.value);
                    const b = db.getBatchesForCourse(e.target.value);
                    setTargetBatchId(b[0]?.id || '');
                  }}
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
                <label className="text-xs font-bold text-slate-700">Batch</label>
                <select
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  {db.getBatchesForCourse(targetCourseId).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Action Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOverrideAction('grant')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 ${
                      overrideAction === 'grant'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Grant Course Access</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideAction('revoke')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 ${
                      overrideAction === 'revoke'
                        ? 'border-red-600 bg-red-50 text-red-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Revoke Course Access</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Mandatory Audit Log Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Offline classroom scholarship awarded / Fee reconciliation completed at campus..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-sm"
                >
                  Apply & Record Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
