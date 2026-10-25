import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700">
        <h1 className="text-3xl font-black text-slate-900">Refund and Cancellation Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: April 2026</p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Online Course Purchases</h2>
          <p>
            At Aspire Academy Online, our mission is to ensure every student receives excellent
            educational value. Because digital materials and enrolled batch allocations become
            accessible immediately upon successful payment verification, we provide free preview
            lessons before purchase so you can inspect teaching style and course quality.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. Technical or Duplicate Charges</h2>
          <p>
            If your account was debited multiple times for a single course enrollment due to a
            network delay or payment gateway glitch, please email us with your Razorpay transaction
            IDs at <strong>contact@aspireacademyonline.in</strong>. Verified duplicate amounts
            will be refunded to the original payment source within 5–7 business days.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. Batch Transfer Requests</h2>
          <p>
            If a student requires a change in batch timing (for example, switching from Morning to
            Evening batch due to school timetable changes), we allow one free batch transfer request
            subject to seat availability.
          </p>
        </section>
      </div>
    </div>
  );
}
