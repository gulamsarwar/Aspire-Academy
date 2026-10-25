import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700">
        <h1 className="text-3xl font-black text-slate-900">Terms and Conditions</h1>
        <p className="text-xs text-slate-500">Effective Date: April 2026</p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By registering, purchasing a course, or accessing course materials on
            Aspire Academy Online (aspireacademyonline.in), you agree to comply with and be
            bound by these terms and conditions.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Account Credentials & Access</h2>
          <p>
            Each student enrollment is personal and non-transferable. Sharing account credentials,
            distributing protected notes, or commercializing lesson content without written permission
            is strictly prohibited and may result in immediate access revocation without refund.
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
  );
}
