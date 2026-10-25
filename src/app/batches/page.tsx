import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { Calendar, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BatchesPage() {
  const batches = db.batches;
  const courses = db.courses;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-3">
          <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Academic Schedule
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Active Batches & Timetables (2026-27)
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Find the batch timing that fits your daily school and self-study schedule.
            Morning and evening options available for Bihar Board and CBSE aspirants.
          </p>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((batch) => {
            const course = courses.find((c) => c.id === batch.course_id);

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-lg">
                      {course?.target_class} • {course?.category}
                    </span>
                    {batch.enrollment_open ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Admissions Open
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                        Batch Full
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{batch.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Course: <strong className="text-slate-800">{course?.title}</strong>
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span><strong>Schedule:</strong> {batch.schedule_description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span>
                        <strong>Enrolled:</strong> {batch.enrolled_count} / {batch.capacity} Students
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span>
                        <strong>Faculty:</strong> {batch.instructor_name || course?.instructor_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-lg font-black text-slate-900">
                    ₹{course?.price.toLocaleString('en-IN')}
                  </span>

                  <Link
                    href={`/courses/${course?.slug}#enroll`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-sm transition"
                  >
                    <span>Enroll in Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
