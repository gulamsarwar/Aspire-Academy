'use client';

import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import { CourseCard } from '@/components/ui/CourseCard';
import {
  BookOpen,
  Sparkles,
  Award,
  Video,
  FileCheck,
  CheckCircle,
  Users,
  ArrowRight,
  Laptop,
  GraduationCap,
  Quote,
} from 'lucide-react';

export default function HomePage() {
  const { settings } = useSiteSettings();
  const courses = db.getCourses(true);
  const liveClasses = db.liveClasses.filter((lc) => lc.status === 'scheduled');
  const upcomingLive = liveClasses[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-[#0B192C] to-slate-900 text-white py-16 sm:py-24 lg:py-28">
        {/* Subtle geometric background glow */}
        <div className="absolute inset-0 hero-gradient pointer-events-none opacity-60" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Bihar Board & NEET Excellence Center</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {settings.hero_headline}
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {settings.description}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/courses"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Courses</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 backdrop-blur-md transition-all duration-200 text-sm"
                >
                  <GraduationCap className="w-4 h-4 text-sky-400" />
                  <span>Student Login</span>
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-center lg:text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-sky-400">
                    {settings.stat_students}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Students Mentored</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">
                    {settings.stat_experience}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Faculty Experience</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {settings.stat_success}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">NCERT Aligned</div>
                </div>
              </div>
            </div>

            {/* Right Card: Live Class Feature Banner / Shekhar Sir Special */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-white/15 p-6 shadow-2xl backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Featured Program
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">2026-27 Session</span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">
                    Class 12 Biology Super-50 Batch
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Personal guidance with Shekhar Sir. Includes complete NCERT line-by-line
                    video lectures, diagram workshops, previous 10 years question solutions,
                    and weekly live YouTube doubt classes.
                  </p>
                </div>

                {/* Key Bullet Points */}
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>50% Objective Question Pattern Mastery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Downloadable Handwritten PDF Notes & Diagrams</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Direct WhatsApp Academic Mentorship</span>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Course Fee</span>
                    <span className="text-2xl font-black text-white">₹399</span>
                    <span className="text-xs text-slate-400 line-through ml-2">₹1,499</span>
                  </div>

                  <Link
                    href="/courses/class-12-biology"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white text-xs shadow-md transition-all hover:scale-105"
                  >
                    <span>View Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. UPCOMING LIVE CLASS ALERT BANNER (If Available) */}
      {upcomingLive && (
        <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white py-3 px-4 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="font-bold">Next YouTube Live Session:</span>
              <span className="text-sky-100">{upcomingLive.title}</span>
            </div>

            <Link
              href="/dashboard/live"
              className="px-4 py-1.5 rounded-lg bg-white text-blue-900 font-bold hover:bg-sky-50 transition text-xs shadow-sm flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-rose-600" />
              <span>Join Class</span>
            </Link>
          </div>
        </section>
      )}

      {/* 3. FEATURED COURSES SECTION */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest block mb-2">
                Curated Academic Programs
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Featured Courses & Target Batches
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                Comprehensive preparation for Bihar Board Class 12, CBSE, NEET, and
                High School Foundation. Structured curriculum with zero fluff.
              </p>
            </div>

            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#046BD2] hover:text-[#0352A0] transition"
            >
              <span>Explore All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => {
              const batches = db.getBatchesForCourse(course.id);
              return <CourseCard key={course.id} course={course} batches={batches} />;
            })}
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE ASPIRE ACADEMY (Authentic Pillars from Reference) */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest">
              The Aspire Advantage
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Choose Aspire Academy?
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              We focus on building strong concepts, rigorous practice, and disciplined
              preparation so every student achieves their academic potential.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#046BD2] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Expert Faculty</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn from dedicated educators led by Shekhar Sir who focus on crystal-clear
                concept explanation, examination strategy, and continuous improvement.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Digital Classes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Modern interactive video classes with digital diagram breakdown, recorded
                revisions, and mobile-friendly access anywhere in Bihar and India.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Regular Tests & Analysis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chapter-wise objective tests, previous 10-year question bank practice, and
                detailed performance evaluation to remove exam fear.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Personal Mentorship</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Individual doubt assistance, academic counseling, and structured study plans
                throughout your entire board and entrance preparation journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW ASPIRE ACADEMY WORKS (Learn -> Practice -> Improve) */}
      <section className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">
              Our 3-Step Methodology
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Aspire Academy Works
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A proven, structured learning approach designed to help students learn,
              practice, and improve consistently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4 relative">
              <div className="text-4xl font-black text-sky-400/40">01</div>
              <h3 className="text-xl font-bold text-white">Learn</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Build strong conceptual foundations through experienced faculty, interactive
                video classes, and structured NCERT chapter breakdowns.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4 relative">
              <div className="text-4xl font-black text-blue-400/40">02</div>
              <h3 className="text-xl font-bold text-white">Practice</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Strengthen your understanding through chapter tests, assignments,
                previous-year solved papers, and diagram drawing exercises.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-4 relative">
              <div className="text-4xl font-black text-emerald-400/40">03</div>
              <h3 className="text-xl font-bold text-white">Improve</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Track your progress on your dashboard, clear doubts in live YouTube sessions,
                identify weak areas, and score 90%+ in exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. GENUINE STUDENT TESTIMONIALS (From Reference Site) */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest">
              Student Experiences
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What Our Students Say
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Real feedback from students who are learning, improving, and preparing with
              Aspire Academy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <Quote className="w-8 h-8 text-sky-400 opacity-60" />
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  “The classes helped me understand difficult concepts clearly. Regular
                  tests and guidance helped me become more confident in my preparation.”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#046BD2] font-bold flex items-center justify-center text-sm">
                  PK
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">PRIYANSHU KUMARI</h4>
                  <p className="text-xs text-slate-500">Class 12 Student</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <Quote className="w-8 h-8 text-sky-400 opacity-60" />
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  “Regular tests, PYQs and doubt support made my preparation much more
                  organized.”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm">
                  RK
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">RUNI KUMARI</h4>
                  <p className="text-xs text-slate-500">Class 11 Student</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <Quote className="w-8 h-8 text-sky-400 opacity-60" />
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  “The digital classes and personal guidance made learning much easier and
                  more interesting.”
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                  PR
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">PRANAV RANJAN</h4>
                  <p className="text-xs text-slate-500">Class 10 Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                How do I join a course after payment?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                As soon as your payment is verified via UPI or Netbanking through our secure
                Razorpay gateway, your enrollment is automatically activated in your Student
                Dashboard under &apos;My Courses&apos; instantly.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Can I choose a specific batch timing?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Yes! Every course offers multiple batch options (e.g., Morning Achievers or
                Evening Super-50). You select your preferred batch before checkout.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                How are the live doubt classes conducted?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Live classes are scheduled and embedded directly on your Live Classes portal
                using YouTube Live stream embeds, where students can ask doubts and chat
                in real-time.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Are notes provided in Hindi or English?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our materials are crafted in Hinglish (Hindi explanation with English
                scientific terminology and NCERT labels) to ensure maximum comfort and high
                scoring in Bihar Board and CBSE.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL READY TO START CALLOUT */}
      <section className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">Ready to Start Learning?</h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Structured classes, expert faculty, regular tests, digital learning and personal
            academic guidance — everything you need to move forward with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/courses"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-xl transition-all hover:scale-105 text-sm"
            >
              Explore Courses Now
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm transition"
            >
              Contact Admissions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
