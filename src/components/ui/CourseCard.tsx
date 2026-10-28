import React from 'react';
import Link from 'next/link';
import { Course, Batch } from '@/lib/types';
import { Clock, ArrowRight, CheckCircle2, Sparkles, Star, Video, FileText } from 'lucide-react';

export function CourseCard({
  course,
  batches = [],
}: {
  course: Course;
  batches?: Batch[];
}) {
  const discountPercent =
    course.original_price > course.price
      ? Math.round(
          ((course.original_price - course.price) / course.original_price) * 100
        )
      : 0;

  const openBatchesCount = batches.filter((b) => b.enrollment_open).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:border-[#046BD2]/50 hover:-translate-y-1">
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-95 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="bg-[#0B192C]/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/10">
            {course.target_class}
          </span>
          <span className="bg-[#046BD2]/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/10">
            {course.category}
          </span>
        </div>

        {discountPercent > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 z-10 animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span>{discountPercent}% OFF</span>
          </div>
        )}

        {/* Live Batch Availability indicator */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] bg-slate-950/85 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10 z-10">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {openBatchesCount > 0
              ? `${openBatchesCount} Batch${openBatchesCount > 1 ? 'es' : ''} Open`
              : 'Enrollment Open'}
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            {course.duration_weeks} Weeks
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Metadata row: Rating + Format */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>4.9</span>
              <span className="text-[10px] text-slate-500 font-medium">(1.2k+ students)</span>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Hinglish
            </span>
          </div>

          {/* Instructor line */}
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#046BD2]" />
            <span>Faculty: <strong className="text-slate-900 font-bold">{course.instructor_name}</strong></span>
          </div>

          {/* Title */}
          <Link href={`/courses/${course.slug}`}>
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#046BD2] transition-colors line-clamp-2 leading-snug">
              {course.title}
            </h3>
          </Link>

          {/* Subtitle */}
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {course.subtitle}
          </p>

          {/* Features checkmarks (PW style quick highlights) */}
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Video className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate font-medium">Live + 1080p HD Recorded Lectures</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate font-medium">Handwritten PDF Notes & DPP Solutions</span>
            </div>
            {course.features.slice(0, 1).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Action Buttons */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                ₹{course.price.toLocaleString('en-IN')}
              </span>
              {course.original_price > course.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{course.original_price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/courses/${course.slug}`}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 text-xs font-bold text-center transition-colors flex items-center justify-center"
            >
              View Syllabus
            </Link>
            <Link
              href={`/courses/${course.slug}#enroll`}
              className="py-2.5 px-3 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/25 hover:scale-[1.02]"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
