'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { Calendar, Users, Clock, ArrowRight, CheckCircle2, Sparkles, Filter, Flame } from 'lucide-react';

export default function BatchesPage() {
  const batches = db.batches;
  const courses = db.courses;

  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const filterTabs = [
    { id: 'All', label: 'All Batches' },
    { id: 'Class 12', label: 'Class 12 Special' },
    { id: 'Class 10', label: 'Class 10 Matric' },
    { id: 'Morning', label: 'Morning Batches' },
    { id: 'Evening', label: 'Evening Batches' },
  ];

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const course = courses.find((c) => c.id === batch.course_id);
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Class 12') return course?.target_class === 'Class 12';
      if (selectedFilter === 'Class 10') return course?.target_class === 'Class 10';
      if (selectedFilter === 'Morning') {
        const desc = (batch.name + ' ' + batch.schedule_description).toLowerCase();
        return desc.includes('morning') || desc.includes('am');
      }
      if (selectedFilter === 'Evening') {
        const desc = (batch.name + ' ' + batch.schedule_description).toLowerCase();
        return desc.includes('evening') || desc.includes('pm');
      }
      return true;
    });
  }, [batches, courses, selectedFilter]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner (Popular EdTech Timetable Hub Style) */}
        <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-4 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Academic Session 2026-27 • Live Timetables</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Target Batches & Timetables
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Find the perfect batch schedule for your school and self-study hours.
              Morning and evening slots available with personal mentorship by <strong>Shekhar Sir</strong>.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Schedule:
          </span>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedFilter === tab.id
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBatches.map((batch) => {
            const course = courses.find((c) => c.id === batch.course_id);
            const fillPercent = Math.min(
              100,
              Math.round((batch.enrolled_count / (batch.capacity || 100)) * 100)
            );
            const seatsLeft = Math.max(0, (batch.capacity || 100) - batch.enrolled_count);

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5 flex flex-col justify-between group hover:-translate-y-1 hover:border-[#046BD2]/50"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#046BD2] bg-blue-50 px-3 py-1 rounded-lg">
                      {course?.target_class} • {course?.category}
                    </span>
                    {batch.enrollment_open ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Admissions Open</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                        Batch Full
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-[#046BD2] transition-colors leading-snug">
                    {batch.name}
                  </h3>

                  <p className="text-xs font-semibold text-slate-500">
                    Target Course: <strong className="text-slate-800">{course?.title}</strong>
                  </p>

                  <div className="pt-2 space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span><strong>Timing:</strong> {batch.schedule_description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span>
                        <strong>Faculty:</strong> {batch.instructor_name || course?.instructor_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#046BD2] flex-shrink-0" />
                      <span>
                        <strong>Seats:</strong> {batch.enrolled_count} / {batch.capacity} Students Enrolled
                      </span>
                    </div>

                    {/* Seat Progress Bar */}
                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Batch Filling Progress</span>
                        <span className={seatsLeft <= 15 ? 'text-rose-600 flex items-center gap-1' : 'text-slate-700'}>
                          {seatsLeft <= 15 && <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />}
                          <span>{seatsLeft} Seats Left</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-[#046BD2] rounded-full transition-all duration-500"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Course Fee</span>
                    <span className="text-2xl font-black text-slate-900">
                      ₹{(course?.price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <Link
                    href={course?.slug ? `/courses/${course.slug}#enroll` : '/courses'}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md shadow-blue-500/25 transition-all hover:scale-105"
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
