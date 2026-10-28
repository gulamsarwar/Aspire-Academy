'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useSiteSettings } from '@/components/settings/SiteSettingsContext';
import {
  HelpCircle,
  Send,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function StudentDoubtsPage() {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rawPhone = (settings.whatsapp || settings.phone || '9123456789').replace(/[^0-9]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : `91${rawPhone}`;
  const doubtWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hello Shekhar Sir, I am a student of Aspire Academy and have an urgent academic doubt.'
  )}`;

  // Doubt submission form
  const [courseId, setCourseId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (!user?.id) {
          setData({ doubts: [], enrollments: [] });
          return;
        }
        const res = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(user.id)}`);
        if (!res.ok) throw new Error('Failed to load doubts data');
        const json = await res.json();
        setData(json);
        if (json.enrollments && json.enrollments.length > 0) {
          setCourseId(json.enrollments[0].course_id);
        }
      } catch (err) {
        console.error('Failed to load doubts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    if (!user?.id) {
      setMessage({ type: 'error', text: 'Please sign in to submit a doubt to Shekhar Sir.' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const studentId = user.id;
      const res = await fetch('/api/student/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId || 'c0000000-0000-0000-0000-000000000001',
          question_text: questionText,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit doubt');
      setQuestionText('');
      setMessage({ type: 'success', text: 'Your doubt has been submitted to Shekhar Sir!' });

      // Refresh doubts
      const dashRes = await fetch(`/api/student/dashboard?studentId=${encodeURIComponent(studentId)}`);
      const json = await dashRes.json();
      setData(json);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const doubts = data?.doubts || [];
  const enrollments = data?.enrollments || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Ask Shekhar Sir — Doubt Resolution Desk
        </h1>
        <p className="text-xs text-slate-500">
          Have questions on Biology diagrams, genetics numericals, or NCERT concepts? Submit below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Doubt Submission Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#046BD2] flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Submit a New Doubt</h2>
              <p className="text-xs text-slate-500">Directly reviewed by Shekhar Sir</p>
            </div>
          </div>

          <form onSubmit={handleSubmitDoubt} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Course / Subject
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#046BD2]"
              >
                {enrollments.length > 0 ? (
                  enrollments.map((enr: any) => (
                    <option key={enr.course_id} value={enr.course_id}>
                      {enr.course?.title}
                    </option>
                  ))
                ) : (
                  <option value="c0000000-0000-0000-0000-000000000001">
                    Class 12th Biology Board Target 2027
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Doubt / Question Description
              </label>
              <textarea
                rows={4}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type your question or numerical query here (e.g. In Mendelian genetics dihybrid cross, how is 9:3:3:1 ratio derived?)..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2] resize-none leading-relaxed"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Question to Faculty</span>
            </button>
          </form>

          {/* Direct WhatsApp Emergency Doubt Box */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
              Need Instant Resolution?
            </span>
            <a
              href={doubtWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Connect on Shekhar Sir WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Doubt History List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Your Doubt History</h2>
            <span className="text-xs font-semibold text-[#046BD2] bg-blue-50 px-2.5 py-0.5 rounded-full">
              {doubts.length} Questions
            </span>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#046BD2] animate-spin" />
            </div>
          ) : doubts.length > 0 ? (
            <div className="space-y-4">
              {doubts.map((d: any) => (
                <div
                  key={d.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full ${
                        d.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status === 'resolved' ? 'Resolved by Shekhar Sir' : 'Pending Faculty Review'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(d.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                    Q: {d.question_text}
                  </p>

                  {d.answer_text ? (
                    <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Faculty Explanation ({d.faculty_name || 'Shekhar Sir'}):</span>
                      </div>
                      <p className="leading-relaxed pl-5">{d.answer_text}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Under evaluation. Shekhar Sir typically responds within 24 hours.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Doubts Asked Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Whenever you get stuck on a topic or numerical problem, submit it above!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
