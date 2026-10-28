'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, ArrowRight, CheckCircle2, Search, Filter, BookOpen, Sparkles, FileText, Star } from 'lucide-react';

export default function NotesPage() {
  const [downloadToast, setDownloadToast] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const freeNotes = [
    {
      id: 'fn-1',
      title: 'Class 12 Biology — Reproduction in Organisms High-Yield Notes',
      subject: 'Biology',
      category: 'Class 12 Biology',
      pages: '14 Pages',
      fileSize: '3.4 MB',
      downloads: '4.8k+',
      description: 'NCERT line-by-line summary, flower diagrams, pollen structure, and 10 solved PYQs with marking scheme.',
    },
    {
      id: 'fn-2',
      title: 'Class 12 Biology — Genetics & Mendelian Inheritance Blueprint',
      subject: 'Biology',
      category: 'Class 12 Biology',
      pages: '18 Pages',
      fileSize: '4.2 MB',
      downloads: '5.2k+',
      description: 'Dihybrid crosses, pedigree analysis, DNA replication diagrams, and Bihar Board 50% objective questions.',
    },
    {
      id: 'fn-3',
      title: 'Class 12 Physics — Electrostatics Formula Sheet & Derivation Maps',
      subject: 'Physics',
      category: 'Class 12 Physics',
      pages: '10 Pages',
      fileSize: '2.8 MB',
      downloads: '3.9k+',
      description: 'Coulombs law derivations, Gauss law applications, electric dipole, and capacitor calculations.',
    },
    {
      id: 'fn-4',
      title: 'Class 12 Physics — Ray Optics & Wave Optics Diagram Summary',
      subject: 'Physics',
      category: 'Class 12 Physics',
      pages: '16 Pages',
      fileSize: '3.7 MB',
      downloads: '3.1k+',
      description: 'Lens makers formula, prism derivations, Youngs double slit experiment, and microscope ray diagrams.',
    },
    {
      id: 'fn-5',
      title: 'Class 12 Chemistry — Organic Named Reactions & Reaction Flowcharts',
      subject: 'Chemistry',
      category: 'Class 12 Chemistry',
      pages: '20 Pages',
      fileSize: '4.5 MB',
      downloads: '4.5k+',
      description: 'All 35 essential named reactions for Bihar Board & CBSE with step-by-step mechanisms and conversion maps.',
    },
    {
      id: 'fn-6',
      title: 'Class 10 Science — Complete Objective Question Bank (50% Pattern)',
      subject: 'Class 10',
      category: 'Class 10 Matric',
      pages: '24 Pages',
      fileSize: '5.1 MB',
      downloads: '6.7k+',
      description: 'Over 250 chapter-wise multiple choice questions with bilingual explanations for Bihar Board matric toppers.',
    },
    {
      id: 'fn-7',
      title: 'Bihar Board Class 12 — Previous 10 Years Solved Question Bank (PYQ)',
      subject: 'Question Bank',
      category: 'PYQ Bank',
      pages: '32 Pages',
      fileSize: '6.8 MB',
      downloads: '8.4k+',
      description: 'Year-wise 2018 to 2025 board exam questions with authentic model answers and examiner marking schemes.',
    },
  ];

  const subjects = ['All', 'Biology', 'Physics', 'Chemistry', 'Class 10', 'Question Bank'];

  const filteredNotes = useMemo(() => {
    return freeNotes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [searchQuery, selectedSubject]);

  const handleDownload = (note: (typeof freeNotes)[0]) => {
    setDownloadToast(`Downloading: "${note.title}"... File ready!`);
    const content = `ASPIRE ACADEMY ONLINE — HIGH-YIELD STUDY NOTES & PYQ BANK
======================================================================
Topic / Course: ${note.title}
Subject: ${note.subject} (${note.category})
Pages & Size: ${note.pages} • ${note.fileSize}
Total Downloads: ${note.downloads}

----------------------------------------------------------------------
NCERT & BIHAR BOARD HIGHLIGHTS:
1. Authentic line-by-line summary verified for Bihar Board (BSEB) & CBSE.
2. High-yield diagrams, step-by-step derivations, and named reactions.
3. Solved previous 10-year examination questions with marking schemes.
4. 50% Objective pattern multiple choice questions with bilingual explanation.
----------------------------------------------------------------------
Academic Leadership: Shekhar Sir & Aspire Academy Faculty
Website: https://aspireacademyonline.in
Student Login: https://aspireacademyonline.in/auth/login
WhatsApp Admissions & Doubt Desk: +91 9123456789
© 2026 Aspire Academy. All rights reserved. Free for student study use.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}_Aspire_Academy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadToast(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner (PhysicsWallah / Unacademy Resource Hub Style) */}
        <div className="bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] rounded-3xl p-8 sm:p-12 text-white shadow-xl space-y-4 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>100% Free Educational Resources • Aspire Library</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Handwritten PDF Notes, Formula Sheets & Solved PYQs
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Download chapter-wise high-yield study materials prepared by <strong>Shekhar Sir</strong> and our senior faculty team.
              Complete NCERT coverage, color diagrams, and 50% objective question bank.
            </p>
          </div>
        </div>

        {/* Search & Subject Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes (e.g. Biology, Electrostatics, PYQ)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#046BD2] bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
              <BookOpen className="w-4 h-4 text-[#046BD2]" />
              <span>Showing <strong>{filteredNotes.length}</strong> Study Materials</span>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Subject:
            </span>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedSubject === sub
                    ? 'bg-[#0B192C] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 flex flex-col justify-between group hover:-translate-y-1 hover:border-[#046BD2]/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-lg">
                      {note.category}
                    </span>
                    <span className="text-slate-500 font-semibold text-[11px]">
                      {note.pages} • {note.fileSize}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#046BD2] transition-colors leading-snug">
                    {note.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {note.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                    <Star className="w-3 h-3 fill-emerald-600" />
                    <span>{note.downloads} Downloads by Students</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(note)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-sm transition active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <Link
                    href="/courses"
                    className="text-xs font-bold text-slate-600 hover:text-[#046BD2] transition flex items-center gap-1"
                  >
                    <span>Full Batch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No notes found</h3>
            <p className="text-xs text-slate-500">Try searching with a different subject or keyword.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All');
              }}
              className="text-xs font-bold text-[#046BD2] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-900">
              Want Interactive Video Lectures & Daily Practice Problems (DPP)?
            </h3>
            <p className="text-xs text-slate-600">
              Enroll in our target batches to get complete NCERT line-by-line video classes and weekly live doubt resolution with Shekhar Sir.
            </p>
          </div>

          <Link
            href="/courses"
            className="px-6 py-3 rounded-xl bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs shadow-md transition whitespace-nowrap"
          >
            Explore Target Batches →
          </Link>
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
