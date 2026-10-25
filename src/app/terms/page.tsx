import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#046BD2] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Terms and Conditions</h1>
              <p className="text-xs text-slate-500">Effective Date: April 2026</p>
            </div>
          </div>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By registering, purchasing a course, or accessing course materials on
              Aspire Academy (aspireacademyonline.in), you agree to comply with and be
              bound by these terms and conditions.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">2. Account Credentials & Access</h2>
            <p>
              Each student enrollment is personal and non-transferable. Sharing account credentials,
              distributing protected notes, or commercializing lesson content without written permission
              is strictly prohibited and may result in immediate access revocation.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">3. Video Lessons & Live Streams</h2>
            <p>
              Lectures and live sessions are delivered using secure streaming technology. Aspire
              Academy reserves the right to modify scheduled timings when needed, with advance
              notice given to enrolled students.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

