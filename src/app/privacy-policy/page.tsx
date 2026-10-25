import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-700">
        <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: April 2026</p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When students register with Aspire Academy Online, we collect personal contact details
            including student name, email address, mobile phone number, selected course and batch,
            and payment references provided by our authorized payment processor.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
          <p>
            We use student information solely to:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Authenticate user access to protected courses, video lessons, and PDF materials.</li>
            <li>Send batch schedule updates, timetable adjustments, and YouTube Live class notifications.</li>
            <li>Process and verify payment transactions via Razorpay.</li>
            <li>Provide personalized academic feedback and doubt clearing.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">3. Payment Security</h2>
          <p>
            Aspire Academy Online never stores debit/credit card numbers, CVVs, or UPI PINs on its
            servers. All transactions are securely handled by Razorpay, a PCI-DSS certified gateway.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">4. Contact Information</h2>
          <p>
            For privacy inquiries, please contact: <br />
            <strong>Aspire Academy Online</strong> <br />
            Email: contact@aspireacademyonline.in <br />
            Phone: +91 9876543210
          </p>
        </section>
      </div>
    </div>
  );
}
