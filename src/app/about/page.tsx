import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  Target,
  BookOpen,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-8 sm:p-14 text-white shadow-xl space-y-4">
          <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            About Aspire Academy
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Empowering Students to Learn Today & Lead Tomorrow
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Aspire Academy was founded to deliver uncompromising quality in coaching for
            Bihar Board, CBSE, NEET, and Science Foundation. We bridge the gap between
            school curricula and competitive entrance exams through expert pedagogy.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#046BD2] flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To provide every student with an accessible, high-standard educational
              environment. We replace rote memorization with deep conceptual understanding,
              rigorous diagram practice, and regular performance evaluations.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Our Pedagogy</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We adhere strictly to the proven 3-phase cycle: <strong>Learn</strong> (interactive
              concept breakdown), <strong>Practice</strong> (NCERT line-by-line questions &
              solved PYQs), and <strong>Improve</strong> (chapter test analysis & live doubt
              resolution).
            </p>
          </div>
        </div>

        {/* Faculty Spotlight */}
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8">
          <div className="space-y-2">
            <span className="text-[#046BD2] text-xs font-bold uppercase tracking-wider block">
              Academic Leadership
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Meet Shekhar Sir & The Core Academic Team
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center font-black text-2xl">
                S
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Shekhar Sir</h3>
                <p className="text-xs text-[#046BD2] font-semibold">
                  Academic Director & Biology Specialist
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                With over a decade of classroom and online teaching experience, Shekhar Sir
                has mentored thousands of Class 12 Bihar Board students to distinction scores.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1E3E62] text-white flex items-center justify-center font-black text-2xl">
                R
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Er. R. K. Verma</h3>
                <p className="text-xs text-[#046BD2] font-semibold">
                  Senior Physics Faculty (Ex-Kota Educator)
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Known for breaking down complex physics derivations and numerical problems into
                intuitive, memorable principles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-2xl">
                A
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Dr. A. Anand</h3>
                <p className="text-xs text-[#046BD2] font-semibold">
                  Head of Chemistry Department
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Specialist in Organic reaction mechanisms, in-text NCERT problem solving, and
                strategic board scoring formulas.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-[#0B192C] text-white p-8 sm:p-12 rounded-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Join Our Growing Community</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Take the first step toward board exam mastery and competitive confidence.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/courses"
              className="px-6 py-3 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs sm:text-sm shadow-md"
            >
              Browse Programs
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
