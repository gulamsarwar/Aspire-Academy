'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import { CourseCard } from '@/components/ui/CourseCard';
import { TypewriterHeadline } from '@/components/home/TypewriterHeadline';
import {
  BookOpen,
  Sparkles,
  Award,
  Video,
  FileCheck,
  CheckCircle2,
  Users,
  ArrowRight,
  Laptop,
  GraduationCap,
  Quote,
  Star,
  Trophy,
  Flame,
  Zap,
  PhoneCall,
  MessageCircle,
  Download,
  FileText,
  CheckSquare,
  HelpCircle,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const { settings } = useSiteSettings();
  const allCourses = db.getCourses(true);
  const liveClasses = db.liveClasses.filter((lc) => lc.status === 'scheduled');
  const upcomingLive = liveClasses[0];

  const [selectedGoal, setSelectedGoal] = useState<string>('all');

  const goals = [
    { id: 'all', label: 'All Batches', tag: 'Complete Catalog' },
    { id: '12th', label: 'Class 12 (Board + NEET)', tag: 'Target 2027' },
    { id: '10th', label: 'Class 10 (Matric Topper)', tag: 'Board Special' },
    { id: 'neet', label: 'NEET Foundation', tag: 'Medical Special' },
    { id: 'notes', label: 'Free PDF Notes', tag: '100% Free' },
  ];

  const displayedCourses = useMemo(() => {
    if (selectedGoal === '12th') {
      return allCourses.filter((c) => c.target_class === 'Class 12');
    }
    if (selectedGoal === '10th') {
      return allCourses.filter((c) => c.target_class === 'Class 10');
    }
    if (selectedGoal === 'neet') {
      return allCourses.filter(
        (c) =>
          c.category.toLowerCase().includes('neet') ||
          c.title.toLowerCase().includes('biology') ||
          c.slug.includes('biology')
      );
    }
    return allCourses;
  }, [allCourses, selectedGoal]);

  const rawPhone = (settings.whatsapp || settings.phone || '919123456789').replace(/[^0-9]/g, '');
  const cleanNumber = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    'Namaste Shekhar Sir, I want admission enquiry for Aspire Academy batch.'
  )}`;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. TOP LIVE TICKER / ADMISSIONS MARQUEE (PhysicsWallah / Allen Style) */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white py-2 px-4 text-xs font-bold shadow-sm overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-white/20 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm flex-shrink-0">
              <Flame className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>Admissions Open 2026-27</span>
            </span>
            <span className="truncate text-white/95">
              Class 10th & 12th Target Batches started • 50% Objective Matrix & Solved PYQ Bank by Shekhar Sir
            </span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-rose-800 hover:bg-amber-50 text-[11px] font-black transition flex-shrink-0 shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 2. HERO SECTION - Modern Educational Theme (PhysicsWallah / Unacademy Style) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/30 to-white text-slate-900 py-12 sm:py-18 lg:py-20 border-b border-slate-200/70">
        {/* Soft background glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[400px] h-[300px] bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#046BD2] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>#1 Trusted Learning Platform for Bihar Board & NEET</span>
              </div>

              {/* Dynamic Typewriter Headline */}
              <TypewriterHeadline headline={settings.hero_headline} />

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                {settings.description}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="#courses-catalog"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Batches (बैच चुनें)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  href="/courses/class-12-biology"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition-all duration-200 text-sm"
                >
                  <PlayCircle className="w-4 h-4 text-rose-600" />
                  <span>Watch Free Demo (डेमो क्लास)</span>
                </Link>

                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-sm"
                >
                  <GraduationCap className="w-4 h-4 text-[#046BD2]" />
                  <span>Student Login</span>
                </Link>
              </div>

              {/* Quick Trust Highlights Counter */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200 text-center lg:text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-[#046BD2]">
                    {settings.stat_students}
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Students Mentored</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-600">
                    98.6%
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Highest Board Score</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-600">
                    {settings.stat_experience}
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Shekhar Sir Exp.</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                    100%
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">NCERT Aligned</div>
                </div>
              </div>
            </div>

            {/* Right Card: Modern Featured Target Program Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-white border-2 border-blue-200 p-6 sm:p-8 shadow-xl shadow-blue-500/10 space-y-6 transition-all duration-300 hover:shadow-2xl hover:border-blue-400 hover:-translate-y-1">
                {/* Header Tag */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600 animate-pulse" />
                    <span>Bestseller Target Batch</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500">Session 2026-27</span>
                </div>

                {/* Batch Title & Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#046BD2]">
                    <span>Class 12 Science Special</span>
                    <span>•</span>
                    <span>Bilingual (Hinglish)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    Class 12 Biology Super-50 Batch
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Direct personal mentorship with <strong>Shekhar Sir</strong>. Complete NCERT line-by-line
                    video lectures, handwritten diagram workshops, solved 10 years question bank,
                    and weekly interactive YouTube Live doubt classes.
                  </p>
                </div>

                {/* Key Bullet Points */}
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">50% Objective Question Pattern Mastery (BSEB Special)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">Downloadable Handwritten Color Diagram & Formula PDF</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">Direct WhatsApp Academic Mentorship with Shekhar Sir</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">Valid till Bihar Board & CBSE 2027 Examinations</span>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Special Offer Fee</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-[#046BD2]">₹399</span>
                      <span className="text-xs text-slate-400 line-through">₹1,499</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">73% OFF</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout/class-12-biology"
                    className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white text-xs shadow-md shadow-blue-500/25 transition-all hover:scale-105"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. UPCOMING LIVE CLASS ALERT BANNER (If Available) */}
      {upcomingLive && (
        <section className="bg-gradient-to-r from-[#0352A0] to-[#046BD2] text-white py-3 px-4 shadow-sm">
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

      {/* 4. HALL OF FAME / BIHAR DISTRICT TOPPERS SECTION (PhysicsWallah & Allen Hallmark) */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Result Speaks • हमारे चमकते सितारे</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Bihar Board & NEET Top Performers
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Consistent top scores year after year. Here are some of our proud students who achieved
              exceptional results with Shekhar Sir&apos;s guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Topper 1 */}
            <div className="bg-white rounded-2xl border-2 border-amber-200/70 p-6 shadow-md hover:shadow-xl transition-all duration-300 space-y-4 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                96.8% Marks
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  PK
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Priya Kumari</h4>
                  <p className="text-xs text-slate-500 font-semibold">Dist. Patna • Class 12 Bio</p>
                </div>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/50">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Score: 484 / 500</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">District Rank 1</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                “Shekhar Sir&apos;s NCERT line-by-line breakdown and 50% objective tests helped me score full 100 in Biology practicals & theory.”
              </p>
            </div>

            {/* Topper 2 */}
            <div className="bg-white rounded-2xl border-2 border-blue-200/70 p-6 shadow-md hover:shadow-xl transition-all duration-300 space-y-4 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#046BD2] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                95.6% Marks
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  RR
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Ritesh Ranjan</h4>
                  <p className="text-xs text-slate-500 font-semibold">Dist. Gaya • Class 12 Science</p>
                </div>
              </div>
              <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/50">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Score: 478 / 500</span>
                  <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">State Top 10</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                “Daily handwritten PDF notes saved my revision time. The test series eliminated my exam fear completely.”
              </p>
            </div>

            {/* Topper 3 */}
            <div className="bg-white rounded-2xl border-2 border-emerald-200/70 p-6 shadow-md hover:shadow-xl transition-all duration-300 space-y-4 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                97.8% Marks
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  SK
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Saurabh Kumar</h4>
                  <p className="text-xs text-slate-500 font-semibold">Dist. Muzaffarpur • Matric</p>
                </div>
              </div>
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/50">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Score: 489 / 500</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">District Rank 2</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                “Concept clarity in Science and Maths was unmatched. Aspire Academy makes online learning actually work.”
              </p>
            </div>

            {/* Topper 4 */}
            <div className="bg-white rounded-2xl border-2 border-purple-200/70 p-6 shadow-md hover:shadow-xl transition-all duration-300 space-y-4 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                NEET 638/720
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-600 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  AS
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Anjali Singh</h4>
                  <p className="text-xs text-slate-500 font-semibold">GMC Selection • Medical</p>
                </div>
              </div>
              <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-200/50">
                <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                  <span>Govt. Medical Seat</span>
                  <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[10px]">AIR Qualified</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                “Biology NCERT line-by-line questions provided by Shekhar Sir gave me 345/360 in NEET Biology.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE GOAL SELECTOR & TARGET BATCHES SECTION */}
      <section id="courses-catalog" className="py-16 sm:py-24 bg-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest block mb-2">
                Curated Academic Programs (2026-27)
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Choose Your Target Exam & Batch
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                Structured curriculum, live & recorded classes, chapter tests, and handwritten notes.
                Select your academic goal below to explore target batches.
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

          {/* Interactive Goal Tabs (PhysicsWallah Style) */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  if (g.id === 'notes') {
                    window.location.href = '/notes';
                  } else {
                    setSelectedGoal(g.id);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                  selectedGoal === g.id
                    ? 'bg-[#0B192C] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{g.label}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedGoal === g.id
                      ? 'bg-sky-400 text-slate-900'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {g.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedCourses.map((course) => {
              const batches = db.getBatchesForCourse(course.id);
              return <CourseCard key={course.id} course={course} batches={batches} />;
            })}
          </div>
        </div>
      </section>

      {/* 6. WHY CHOOSE ASPIRE ACADEMY (Pillars Grid - PhysicsWallah / Allen Level) */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest">
              The Aspire Advantage
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why 10,000+ Students Trust Aspire Academy
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              We focus on building strong concepts, rigorous practice, and disciplined preparation
              so every student achieves their academic potential.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#046BD2] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Expert Faculty Guidance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn directly from Shekhar Sir and senior educators who specialize in line-by-line
                NCERT explanation, examination strategy, and personalized mentorship.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Zero-Buffering HD Classes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast Cloudflare R2 streaming + YouTube Live classes with speed controls (0.75x to 2x)
                and low data usage, optimized for any mobile device across Bihar.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">50% Objective Question Bank</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Chapter-wise multiple choice quizzes, previous 10-year question bank practice, and
                detailed performance evaluation tailored to the Bihar Board pattern.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition duration-200 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Direct WhatsApp Doubt Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No chatbot walls! Send your question photos or voice notes directly to Shekhar Sir
                and get step-by-step guidance whenever you get stuck.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MEET SHEKHAR SIR - EDUCATOR SPOTLIGHT */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Educator Avatar / Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-tr from-sky-400 to-[#046BD2] p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-[22px] bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4 border border-white/10">
                    <div className="w-24 h-24 rounded-full bg-blue-600 text-white font-black text-3xl flex items-center justify-center border-4 border-white/20 shadow-lg">
                      SS
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Shekhar Sir</h3>
                      <p className="text-xs text-sky-300 font-semibold mt-1">
                        Academic Director & Biology Specialist
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                      <span className="text-xs text-white ml-1 font-bold">5.0 / 5.0</span>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 border-2 border-white">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verified Mentor</span>
                </div>
              </div>
            </div>

            {/* Educator Info & Credentials */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-sky-400 text-xs font-bold uppercase tracking-widest">
                  Lead Academician & Founder
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug">
                  Guided by Shekhar Sir: 10+ Years of Academic Excellence
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  “My mission is simple: eliminate fear from Science and Board exams for students across Bihar.
                  Every concept is taught from roots to exam-scoring level, with zero rote memorization and complete NCERT mastery.”
                </p>
              </div>

              {/* Achievements Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="text-2xl font-black text-sky-400">5,000+</div>
                  <div className="text-xs text-slate-300 font-medium mt-1">Toppers Mentored</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="text-2xl font-black text-emerald-400">50+</div>
                  <div className="text-xs text-slate-300 font-medium mt-1">Video Lectures</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-2xl font-black text-amber-400">100%</div>
                  <div className="text-xs text-slate-300 font-medium mt-1">NCERT Coverage</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Ask Shekhar Sir on WhatsApp</span>
                </a>

                <Link
                  href="/courses/class-12-biology"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Watch Shekhar Sir&apos;s Demo Class</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREE STUDY MATERIAL & FORMULA SHEETS PREVIEW */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest block mb-2">
                Free Educational Resources
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Handwritten PDF Notes & Formula Sheets
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                Download high-yield revision materials prepared by Shekhar Sir and our faculty team.
                NCERT line-by-line verified and 100% free to download.
              </p>
            </div>

            <Link
              href="/notes"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#046BD2] hover:text-[#0352A0] transition"
            >
              <span>View All Free Notes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-lg">
                  Biology (Shekhar Sir)
                </span>
                <span className="text-slate-500 font-medium">14 Pages • PDF</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Class 12 Biology — Reproduction in Organisms High-Yield Notes
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                NCERT line-by-line summary, flower diagrams, pollen structure, and 10 solved PYQs.
              </p>
              <div className="pt-2">
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#046BD2] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Free PDF Notes</span>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Physics
                </span>
                <span className="text-slate-500 font-medium">10 Pages • PDF</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Class 12 Physics — Electrostatics Formula Sheet & Derivation Maps
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coulombs law derivations, Gauss law applications, and dipole calculations.
              </p>
              <div className="pt-2">
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#046BD2] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Free PDF Notes</span>
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">
                  Class 10 Matric
                </span>
                <span className="text-slate-500 font-medium">22 Pages • PDF</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Class 10 Science — Complete Objective Question Bank (50% Pattern)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Over 200 chapter-wise multiple choice questions with bilingual explanations.
              </p>
              <div className="pt-2">
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#046BD2] hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Free PDF Notes</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. HOW ASPIRE ACADEMY WORKS (Learn -> Practice -> Score) */}
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

      {/* 10. STUDENT & PARENT REVIEWS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest">
              Student Experiences
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What Our Students & Parents Say
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
                  <p className="text-xs text-slate-500">Class 12 Student (Bihar Board)</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <Quote className="w-8 h-8 text-sky-400 opacity-60" />
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  “Regular tests, PYQs and doubt support on WhatsApp made my preparation much more
                  organized and stress-free.”
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
                  “The digital classes and personal guidance from Shekhar Sir made learning biology much easier and
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

      {/* 11. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions (अक्सर पूछे जाने वाले सवाल)
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                How do I join a course after payment?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                As soon as your payment is verified via UPI, Google Pay, PhonePe, or Netbanking,
                your enrollment is automatically activated in your Student Dashboard under &apos;My Courses&apos; instantly.
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

      {/* 12. FINAL CALL TO ACTION BANNER */}
      <section className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">Ready to Score 90%+ in Your Board Exams?</h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Structured classes, Shekhar Sir&apos;s personal guidance, regular tests, digital learning, and handwritten notes —
            everything you need to move forward with complete confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="#courses-catalog"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-xl transition-all hover:scale-105 text-sm"
            >
              Explore Batches Now
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl text-sm transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Contact Admissions on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
