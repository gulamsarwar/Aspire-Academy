'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function NotesPage() {
  const [downloadToast, setDownloadToast] = useState('');

  const freeNotes = [
    {
      id: 'fn-1',
      title: 'Class 12 Biology — Reproduction in Organisms High-Yield Notes',
      subject: 'Biology (Shekhar Sir)',
      pages: '14 Pages',
      fileSize: '3.4 MB',
      description: 'NCERT line-by-line summary, flower diagrams, pollen structure, and 10 solved PYQs.',
    },
    {
      id: 'fn-2',
      title: 'Class 12 Physics — Electrostatics Formula Sheet & Derivation Maps',
      subject: 'Physics',
      pages: '10 Pages',
      fileSize: '2.8 MB',
      description: 'Coulombs law derivations, Gauss law applications, and dipole calculations.',
    },
    {
      id: 'fn-3',
      title: 'Class 12 Chemistry — Organic Named Reactions & Reaction Flowcharts',
      subject: 'Chemistry',
      pages: '18 Pages',
      fileSize: '4.1 MB',
      description: 'All 35 essential named reactions for Bihar Board & CBSE with step-by-step mechanisms.',
    },
    {
      id: 'fn-4',
      title: 'Class 10 Science — Complete Objective Question Bank (50% Pattern)',
      subject: 'Foundation Science',
      pages: '22 Pages',
      fileSize: '4.8 MB',
      description: 'Over 200 chapter-wise multiple choice questions with bilingual explanations.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-3">
          <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            Free Educational Resources
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Handwritten PDF Notes & Formula Sheets
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Download high-yield study materials prepared by Shekhar Sir and our faculty
            team. Authentic, NCERT-verified, and completely free.
          </p>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {freeNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-lg">
                    {note.subject}
                  </span>
                  <span className="text-slate-500 font-medium">
                    {note.pages} • {note.fileSize}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {note.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setDownloadToast(`Preparing download: "${note.title}"... PDF ready!`);
                    setTimeout(() => setDownloadToast(''), 4000);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <Link
                  href="/courses"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1"
                >
                  <span>Enroll in Full Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {downloadToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0B192C] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-sky-400/30 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-semibold">{downloadToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
