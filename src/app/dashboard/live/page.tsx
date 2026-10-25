'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Video,
  Clock,
  Calendar,
  User,
  ExternalLink,
  ShieldAlert,
  Play,
  CheckCircle2,
} from 'lucide-react';

export default function LiveClassesPage() {
  const { user } = useAuth();
  const liveClasses = db.liveClasses;

  const [activeClassId, setActiveClassId] = useState<string>(
    liveClasses[0]?.id || ''
  );

  const activeClass = liveClasses.find((lc) => lc.id === activeClassId) || liveClasses[0];
  const activeCourse = db.getCourseById(activeClass?.course_id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          YouTube Live Interactive Classes
        </h1>
        <p className="text-xs text-slate-500">
          Live stream doubt sessions, model paper solutions, and numerical workshops.
        </p>
      </div>

      {/* Main Live Class Player & Chat Layout */}
      {activeClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Video Stream Container */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <iframe
                title={activeClass.title}
                src={`https://www.youtube-nocookie.com/embed/${activeClass.youtube_video_id}?autoplay=0&rel=0&modestbranding=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  Live Stream Room
                </span>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Scheduled: {new Date(activeClass.scheduled_at).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{activeClass.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeClass.description}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Faculty: <strong>{activeClass.instructor_name}</strong></span>
                <span>Course: <strong>{activeCourse?.title}</strong></span>
              </div>
            </div>

            {/* Note about unlisted stream URL security */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <p>
                <strong>Security Notice:</strong> Live streams are hosted via YouTube Live.
                Please do not share stream links outside your enrolled batch community.
              </p>
            </div>
          </div>

          {/* Schedule List / Past Classes */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              All Scheduled Sessions
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {liveClasses.map((lc) => {
                const isSelected = lc.id === activeClassId;
                const course = db.getCourseById(lc.course_id);

                return (
                  <div
                    key={lc.id}
                    onClick={() => setActiveClassId(lc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition space-y-1.5 ${
                      isSelected
                        ? 'border-[#046BD2] bg-blue-50/70 shadow-sm'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-rose-600 uppercase">
                        {lc.status}
                      </span>
                      <span className="text-slate-400">
                        {new Date(lc.scheduled_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                      {lc.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      Faculty: {lc.instructor_name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
