'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  BookOpen,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function WeeklySchedulePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      try {
        setLoading(true);
        const studentId = user?.id || '';
        const url = studentId ? `/api/student/dashboard?studentId=${encodeURIComponent(studentId)}` : '/api/student/dashboard';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load schedule');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [user?.id]);

  const enrollments = data?.enrollments || [];
  const liveClasses = data?.liveClasses || [];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Weekly Schedule & Batch Timetable
        </h1>
        <p className="text-xs text-slate-500">
          Timetables for your enrolled batches, live discussion sessions, and weekly tests.
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Batches Timetable Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#046BD2]" />
              <span>Weekly Academic Timetable (Mon – Sat)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daysOfWeek.map((day, idx) => {
                const daySessions = liveClasses.filter((_: any, i: number) => i % 6 === idx);

                return (
                  <div
                    key={day}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="font-black text-sm text-slate-800">{day}</span>
                      <span className="text-[10px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                        Aspire Class
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#046BD2]" />
                            <span>04:00 PM – 05:30 PM</span>
                          </span>
                          <span className="text-emerald-600 font-bold">Class 12th Board</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          Biology Lecture & Diagram Mastery
                        </h4>
                        <p className="text-[11px] text-slate-500">Faculty: Shekhar Sir</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-500" />
                            <span>06:00 PM – 07:15 PM</span>
                          </span>
                          <span className="text-rose-600 font-bold">Live YouTube</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          Live Numericals & Model Paper Solving
                        </h4>
                        <p className="text-[11px] text-slate-500">Interactive Doubt Room</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Live Sessions Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-600" />
                <span>Upcoming Scheduled Events & Streams</span>
              </h2>
              <Link
                href="/dashboard/live"
                className="text-xs font-bold text-[#046BD2] hover:underline"
              >
                Open Live Room →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {liveClasses.map((lc: any) => (
                <div
                  key={lc.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                        {lc.status === 'live' ? '● Live Now' : 'Scheduled'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(lc.scheduled_at).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">•</span>
                      <span className="text-xs text-slate-600 font-semibold">
                        {new Date(lc.scheduled_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{lc.title}</h4>
                    <p className="text-xs text-slate-500">{lc.description}</p>
                  </div>

                  <Link
                    href="/dashboard/live"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm transition self-start sm:self-auto"
                  >
                    <span>View Stream</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
