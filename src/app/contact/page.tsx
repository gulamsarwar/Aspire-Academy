'use client';

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    selectedClass: 'Class 12',
    subjectInterest: 'Class 12 Biology (Shekhar Sir)',
    message: '',
    honeypot: '', // anti-spam
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check honeypot for bot spam
    if (formData.honeypot) {
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError('Please provide your name and phone number.');
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-3">
          <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            We are here to assist
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Get in Touch with Aspire Academy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Have questions about courses, batch timings, fees, or admissions? Connect
            with our academic counselors directly via phone, WhatsApp, or the enquiry
            form below.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <a
            href="tel:+919876543210"
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition space-y-2 block group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center group-hover:scale-105 transition">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Call Us Directly</h3>
            <p className="text-xs text-slate-500 font-medium">+91 9876543210</p>
            <span className="text-[11px] text-[#046BD2] font-semibold block pt-1">
              Tap to call →
            </span>
          </a>

          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noreferrer"
            className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition space-y-2 block group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">WhatsApp Chat</h3>
            <p className="text-xs text-slate-500 font-medium">Quick admission guidance</p>
            <span className="text-[11px] text-emerald-600 font-semibold block pt-1">
              Start chat →
            </span>
          </a>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
            <p className="text-xs text-slate-500 font-medium">contact@aspireacademyonline.in</p>
            <span className="text-[11px] text-slate-400 block pt-1">24 hr reply</span>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Office Hours</h3>
            <p className="text-xs text-slate-500 font-medium">Mon – Sat: 7:00 AM – 8:30 PM</p>
            <span className="text-[11px] text-amber-600 font-semibold block pt-1">
              Counselors available
            </span>
          </div>
        </div>

        {/* Main Form & Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Enquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">
                Submit an Admission Enquiry
              </h2>
              <p className="text-xs text-slate-500">
                Fill in your details and our counselor will call you with batch schedules.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-900">
                  Thank You, {formData.fullName}!
                </h3>
                <p className="text-xs text-emerald-700 max-w-sm mx-auto leading-relaxed">
                  Your enquiry has been received. Our academic team will contact you on{' '}
                  <strong>{formData.phone}</strong> shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      fullName: '',
                      phone: '',
                      selectedClass: 'Class 12',
                      subjectInterest: 'Class 12 Biology (Shekhar Sir)',
                      message: '',
                      honeypot: '',
                    });
                  }}
                  className="text-xs font-bold text-emerald-800 underline pt-2"
                >
                  Send another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Honeypot field for anti-spam (hidden from real users) */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="website_url_honey"
                    value={formData.honeypot}
                    onChange={(e) =>
                      setFormData({ ...formData, honeypot: e.target.value })
                    }
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Student Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priyanshu Kumari"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Select Class / Target <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.selectedClass}
                      onChange={(e) =>
                        setFormData({ ...formData, selectedClass: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2] bg-white"
                    >
                      <option value="Class 12">Class 12 (Bihar Board / CBSE)</option>
                      <option value="Class 11">Class 11 (Foundation)</option>
                      <option value="Class 10">Class 10 (Board Topper)</option>
                      <option value="Class 9">Class 9 (Science Foundation)</option>
                      <option value="NEET Dropper">NEET Target Batch</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Primary Subject Interest <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subjectInterest}
                      onChange={(e) =>
                        setFormData({ ...formData, subjectInterest: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2] bg-white"
                    >
                      <option value="Class 12 Biology (Shekhar Sir)">
                        Class 12 Biology (Shekhar Sir)
                      </option>
                      <option value="Class 12 Physics">Class 12 Physics</option>
                      <option value="Class 12 Chemistry">Class 12 Chemistry</option>
                      <option value="Full PCB Board Combo">Full PCB Board Combo</option>
                      <option value="Class 10 Board Foundation">
                        Class 10 Board Foundation
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Your Question or Query (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mention any queries regarding batch timings, fee concessions, or online classes..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Admission Enquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Campus Map & Address Box */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-5">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#046BD2]" />
                  <span>Aspire Academy Campus</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Near Rajendra Nagar Main Road, Bihar, India. Students and parents are
                  welcome to visit our administrative office for one-on-one counseling.
                </p>
              </div>

              {/* Responsive Google Maps Embed */}
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <iframe
                  title="Aspire Academy Location"
                  src="https://maps.google.com/maps?q=aspire%20academy&t=m&z=13&output=embed&iwloc=near"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
