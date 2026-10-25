import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Privacy Policy</h1>
              <p className="text-xs text-slate-500">Effective Date: April 2026</p>
            </div>
          </div>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              When students register with Aspire Academy, we collect personal contact details
              including student name, email address (Gmail), mobile phone number, selected course and batch,
              and payment transaction references provided by our authorized payment processor.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">2. How We Use Your Information</h2>
            <p>
              We use student information solely to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Authenticate user access to protected courses, video lessons, and PDF materials.</li>
              <li>Send batch schedule updates, timetable adjustments, and YouTube Live class notifications.</li>
              <li>Process and verify payment transactions securely via Razorpay UPI.</li>
              <li>Provide personalized academic feedback and doubt clearing led by Shekhar Sir.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">3. Payment Security</h2>
            <p>
              Aspire Academy never stores debit/credit card numbers, CVVs, or UPI PINs on its
              servers. All transactions are securely handled by Razorpay, a PCI-DSS certified gateway.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900">4. Contact Information</h2>
            <p>
              For privacy inquiries, please contact: <br />
              <strong>Aspire Academy</strong> <br />
              Email: contact@aspireacademyonline.in <br />
              Phone: +91 9876543210
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

