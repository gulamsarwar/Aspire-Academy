'use client';

import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import {
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  Video,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const metrics = db.getAdminMetrics();
  const recentOrders = db.orders.slice(0, 5);
  const auditLogs = db.auditLogs.slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Academy Administration & Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Live statistics, enrollment trends, order verifications, and student access audits.
          </p>
        </div>

        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs shadow transition self-start md:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Manage Courses →</span>
        </Link>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/courses"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-[#046BD2] shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#046BD2] transition" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Course Management</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage courses, edit curriculum, and organize video lessons
          </p>
        </Link>

        <Link
          href="/admin/live"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-500 shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <Video className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Live Classes</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Schedule live YouTube stream lectures and manage schedules
          </p>
        </Link>

        <Link
          href="/admin/quizzes"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Award className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Quizzes & Tests</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Import DOCX/text questions, set marks, and review submissions
          </p>
        </Link>

        <Link
          href="/admin/batches"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Batches & Timing</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure target batches, enrollment caps, and study timings
          </p>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Students
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {metrics.totalStudents}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Registered Profiles</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Published Courses
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {metrics.publishedCourses}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold">Active in Catalog</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Batches
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {metrics.activeBatches}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Enrollment Open</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Enrollments
          </span>
          <span className="text-2xl font-black text-slate-900 block">
            {metrics.activeEnrollments}
          </span>
          <span className="text-[10px] text-purple-600 font-semibold">Active Seats</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue
          </span>
          <span className="text-2xl font-black text-[#046BD2] block">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">Gateway Verified</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Live Classes
          </span>
          <span className="text-2xl font-black text-rose-600 block">
            {metrics.upcomingLiveCount}
          </span>
          <span className="text-[10px] text-rose-600 font-semibold">Scheduled / Live</span>
        </div>
      </div>

      {/* Recent Orders & Audit Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#046BD2]" />
              <span>Recent Payment Orders</span>
            </h3>
            <Link
              href="/admin/payments"
              className="text-xs font-bold text-[#046BD2] hover:underline"
            >
              View All ({db.orders.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Course / Batch</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gateway Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const course = db.getCourseById(order.course_id);
                  const batch = db.getBatchById(order.batch_id);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {order.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                          {course?.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{batch?.name}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        ₹{order.amount}
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'paid' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            PAID
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">
                            {order.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                        {order.gateway_payment_id || order.gateway_order_id}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Box */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Admin Audit History</span>
          </h3>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700">{log.action}</span>
                  <span className="text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong>Reason:</strong> {log.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
