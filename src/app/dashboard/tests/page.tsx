'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthContext';
import { MathRenderer } from '@/components/ui/MathRenderer';
import {
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Bookmark,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  AlertTriangle,
  History,
  Check,
  Flag,
  ListFilter,
  Eye,
} from 'lucide-react';

export default function AllTestsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab: 'tests' | 'history'
  const [activeTab, setActiveTab] = useState<'tests' | 'history'>('tests');

  // Selected quiz for intro modal
  const [quizForIntro, setQuizForIntro] = useState<any>(null);

  // Active quiz session state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [initialDurationSeconds, setInitialDurationSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // History past attempts
  const [historyAttempts, setHistoryAttempts] = useState<any[]>([]);
  const [selectedHistoryAttempt, setSelectedHistoryAttempt] = useState<any>(null);

  // Fetch student tests and dashboard data
  useEffect(() => {
    fetchTestsAndHistory();
  }, [user?.id]);

  const fetchTestsAndHistory = async () => {
    try {
      setLoading(true);
      const studentId = user?.id || '';
      const url = studentId ? `/api/student/dashboard?studentId=${encodeURIComponent(studentId)}` : '/api/student/dashboard';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load tests');
      const json = await res.json();
      setData(json);
      setHistoryAttempts(json.quiz_attempts || json.attempts || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Warn before exit when in active quiz
  useEffect(() => {
    if (!activeQuiz || quizResult) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active examination in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeQuiz, quizResult]);

  // Quiz Timer Countdown
  useEffect(() => {
    if (!activeQuiz || quizResult || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, quizResult, timeLeftSeconds]);

  // Handle open intro
  const handleOpenIntro = (quizSummary: any) => {
    setQuizForIntro(quizSummary);
  };

  // Handle start quiz
  const handleStartExam = async (quizSummary: any) => {
    try {
      setLoading(true);
      setQuizForIntro(null);
      // Request sanitized exam questions (strips correct answer keys and explanations)
      const res = await fetch(`/api/quizzes/${quizSummary.id}?mode=exam`);
      if (!res.ok) throw new Error('Failed to load examination paper');
      const json = await res.json();

      const quizData = json.quiz;
      const durationSecs = (quizData.duration_minutes || 30) * 60;

      setActiveQuiz(quizData);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setMarkedForReview({});
      setTimeLeftSeconds(durationSecs);
      setInitialDurationSeconds(durationSecs);
      setQuizResult(null);
      setShowPaletteDrawer(false);
      setShowSubmitConfirmModal(false);
    } catch (err: any) {
      alert(`Could not start exam: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleClearOption = (questionId: string) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleToggleMarkReview = (questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setShowSubmitConfirmModal(false);

      const studentId = user?.id;
      if (!studentId) {
        alert('Please sign in to submit your test.');
        setIsSubmitting(false);
        return;
      }
      const timeTakenSecs = Math.max(1, initialDurationSeconds - timeLeftSeconds);

      const res = await fetch(`/api/quizzes/${activeQuiz.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          answers: selectedAnswers,
          time_taken_seconds: timeTakenSecs,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to submit and evaluate examination');
      }

      const json = await res.json();
      setQuizResult(json);
      // Refresh past attempts list
      fetchTestsAndHistory();
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tests = data?.tests || [];
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    if (mins === 0) return `${s}s`;
    return `${mins}m ${s}s`;
  };

  // Current Question
  const currentQ = activeQuiz?.questions?.[currentQuestionIndex];
  const totalQuestions = activeQuiz?.questions?.length || 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const reviewedCount = Object.values(markedForReview).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* 1. Header & Tab Navigation */}
      {!activeQuiz && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Online Examination & Test Series</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Test Series & Chapter Practice MCQs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chapter-wise mock tests, Hindi & English bilingual questions, and instant KaTeX formula solutions led by Shekhar Sir.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'tests'
                  ? 'bg-white text-[#046BD2] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Available Tests ({tests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-white text-[#046BD2] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Test History ({historyAttempts.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. When a test is active: Mobile-First Examination Screen */}
      {activeQuiz ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in">
          {/* Exam Top Bar */}
          <div className="bg-[#0B192C] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-sky-300 flex items-center justify-center font-bold text-xs border border-blue-400/30">
                {activeQuiz.subject?.charAt(0) || 'B'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider">
                    {activeQuiz.subject} • {activeQuiz.target_class || 'Class 12th'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  {activeQuiz.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!quizResult && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
                    timeLeftSeconds < 120
                      ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
                      : 'bg-white/10 border-white/10 text-amber-300'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatTimer(timeLeftSeconds)}</span>
                </div>
              )}

              {!quizResult && (
                <button
                  onClick={() => setShowPaletteDrawer(!showPaletteDrawer)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
                >
                  <ListFilter className="w-3.5 h-3.5 text-sky-300" />
                  <span className="hidden sm:inline">Palette</span>
                  <span>({answeredCount}/{totalQuestions})</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (quizResult || confirm('Are you sure you want to exit the examination? Unsaved progress will be lost.')) {
                    setActiveQuiz(null);
                    setQuizResult(null);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-xs font-bold text-slate-300 transition"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Results Screen */}
          {quizResult ? (
            <div className="p-6 sm:p-10 space-y-8">
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border border-blue-200 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#046BD2] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Examination Completed!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Your answers have been verified against the official answer keys and scoring rules.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto pt-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 block">Final Score</span>
                    <span className="text-2xl font-black text-[#046BD2]">
                      {quizResult.attempt?.score} / {quizResult.attempt?.total_marks}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 block">Percentage</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {quizResult.attempt?.percentage}%
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 block">Correct</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {quizResult.attempt?.correct_count}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 block">Incorrect</span>
                    <span className="text-2xl font-black text-red-500">
                      {quizResult.attempt?.incorrect_count}
                    </span>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Status</span>
                    <span
                      className={`text-xl font-black ${
                        quizResult.attempt?.passed ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {quizResult.attempt?.passed ? 'Passed ✓' : 'Needs Practice'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => handleStartExam(activeQuiz)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#046BD2] hover:bg-[#0352A0] transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Exam</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveQuiz(null);
                      setQuizResult(null);
                      setActiveTab('tests');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Back to Test Series
                  </button>
                </div>
              </div>

              {/* Detailed Solutions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Detailed Mathematical Solutions & Explanation</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    Evaluated Server-Side
                  </span>
                </div>

                <div className="space-y-4">
                  {(quizResult.solutions || activeQuiz.questions).map((q: any, idx: number) => {
                    const studentAns = selectedAnswers[q.id];
                    const isCorrect = studentAns === q.correct_option;
                    const isUnanswered = !studentAns;

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-5 rounded-2xl border transition space-y-3 ${
                          isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : isUnanswered
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-red-50/40 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Question #{idx + 1}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : isUnanswered
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isCorrect
                              ? 'Correct (+1)'
                              : isUnanswered
                              ? 'Unanswered (0)'
                              : 'Incorrect (-penalty)'}
                          </span>
                        </div>

                        <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                          <MathRenderer content={q.question_text} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {q.options?.map((opt: any) => {
                            const isSelected = studentAns === opt.key;
                            const isOfficialKey = q.correct_option === opt.key;

                            return (
                              <div
                                key={opt.key}
                                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                  isOfficialKey
                                    ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-950 ring-1 ring-emerald-400'
                                    : isSelected
                                    ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-200/60 font-bold flex items-center justify-center text-[10px]">
                                    {opt.key}
                                  </span>
                                  <MathRenderer content={opt.text} />
                                </div>

                                {isOfficialKey && (
                                  <span className="text-[10px] font-black text-emerald-700 uppercase">
                                    Correct Key
                                  </span>
                                )}
                                {isSelected && !isOfficialKey && (
                                  <span className="text-[10px] font-black text-red-600 uppercase">
                                    Your Choice
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="mt-2 p-3 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-[#046BD2] block text-[11px]">
                              Solution & Teacher Explanation:
                            </span>
                            <MathRenderer content={q.explanation} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Active Question Card */
            <div className="p-4 sm:p-8 space-y-6">
              {/* Question Navigation Palette Drawer (expandable) */}
              {showPaletteDrawer && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Question Palette Status</span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Answered
                      </span>
                      <span className="flex items-center gap-1 text-amber-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Review
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Skipped
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {activeQuiz.questions.map((_: any, idx: number) => {
                      const qId = activeQuiz.questions[idx]?.id;
                      const isAnswered = !!selectedAnswers[qId];
                      const isReviewed = !!markedForReview[qId];
                      const isCurrent = currentQuestionIndex === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentQuestionIndex(idx);
                            setShowPaletteDrawer(false);
                          }}
                          className={`h-9 rounded-xl font-bold text-xs flex items-center justify-center transition border ${
                            isCurrent
                              ? 'ring-2 ring-[#046BD2] ring-offset-2 border-[#046BD2]'
                              : ''
                          } ${
                            isReviewed
                              ? 'bg-amber-100 border-amber-400 text-amber-900'
                              : isAnswered
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Question Header & Review Flag */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] font-black text-xs">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Single Choice MCQ • +{currentQ?.marks || 1} Marks
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleMarkReview(currentQ.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition border ${
                      markedForReview[currentQ.id]
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-600" />
                    <span>{markedForReview[currentQ.id] ? 'Marked for Review' : 'Mark Review'}</span>
                  </button>

                  {selectedAnswers[currentQ.id] && (
                    <button
                      onClick={() => handleClearOption(currentQ.id)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-red-600 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 sm:p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                <MathRenderer content={currentQ?.question_text || ''} />
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {currentQ?.options?.map((opt: any) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.key;

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(currentQ.id, opt.key)}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition group ${
                        isSelected
                          ? 'border-[#046BD2] bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-[#046BD2] text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <div className="text-xs sm:text-sm font-semibold text-slate-800">
                          <MathRenderer content={opt.text} />
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#046BD2] bg-[#046BD2] text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Exam Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowSubmitConfirmModal(true)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                    </span>
                  ) : (
                    <span>Submit Examination</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'tests' ? (
        /* 3. Available Tests List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <Loader2 className="w-8 h-8 text-[#046BD2] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-bold">Loading Test Series & Chapter MCQs...</p>
            </div>
          ) : tests.length > 0 ? (
            tests.map((quiz: any) => (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {quiz.subject || 'Biology'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {quiz.target_class || 'Class 12th Board'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {quiz.description || 'Chapter practice test with Hindi & English math formulas.'}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Questions</span>
                      <span className="text-xs font-black text-slate-800">
                        {quiz.questions_count || quiz.questions?.length || 3} Qs
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <span className="text-xs font-black text-slate-800">
                        {quiz.duration_minutes || 20}m
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block">Marks</span>
                      <span className="text-xs font-black text-emerald-600">
                        {quiz.total_marks || 10} M
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenIntro(quiz)}
                  className="w-full py-3 rounded-2xl bg-[#046BD2] hover:bg-[#0352A0] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>View Details & Start Test</span>
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Active Tests Scheduled</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Check back shortly. Shekhar Sir updates weekly mock tests and practice MCQ sets regularly.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 4. Quiz History Tab */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#046BD2]" />
            <span>Past Test Attempts & Performance History</span>
          </h2>

          {historyAttempts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {historyAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        attempt.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {attempt.passed ? 'Passed ✓' : 'Needs Review'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {attempt.quiz?.title || 'Chapter Practice Test'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Submitted on: {new Date(attempt.completed_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-lg font-black text-[#046BD2] block">
                        {attempt.score} / {attempt.total_marks}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600">
                        {attempt.percentage}%
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const q = tests.find((t: any) => t.id === attempt.quiz_id) || attempt.quiz;
                        if (q) handleOpenIntro(q);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Re-attempt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Past Attempts Recorded</h4>
              <p className="text-xs text-slate-500">
                Attempt any available test above to start building your examination record.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Quiz Introduction Modal */}
      {quizForIntro && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#046BD2] bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                  {quizForIntro.subject || 'Biology'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {quizForIntro.title}
                </h3>
              </div>
              <button
                onClick={() => setQuizForIntro(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Total Questions</span>
                <span className="font-black text-slate-900">
                  {quizForIntro.questions_count || quizForIntro.questions?.length || 3} Questions
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Total Marks</span>
                <span className="font-black text-emerald-600">
                  {quizForIntro.total_marks || 10} Marks
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Duration</span>
                <span className="font-black text-slate-900">
                  {quizForIntro.duration_minutes || 20} Minutes
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Passing %</span>
                <span className="font-black text-slate-900">
                  {quizForIntro.passing_percentage || 40}% Minimum
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Examination Instructions:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                <li>Negative marking: -{quizForIntro.negative_marking || 0} marks for incorrect answers.</li>
                <li>Timer counts down continuously. Auto-submission on zero.</li>
                <li>Do not refresh or leave the active tab while taking the test.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQuizForIntro(null)}
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartExam(quizForIntro)}
                className="flex-1 py-3 rounded-2xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white transition shadow-md flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Examination Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Confirm Submission</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you ready to submit your exam? You will not be able to change your answers after submission.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs py-2">
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block">Answered</span>
                <span className="font-black text-emerald-700 text-base">{answeredCount}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Skipped</span>
                <span className="font-black text-slate-700 text-base">{unansweredCount}</span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 block">Reviewed</span>
                <span className="font-black text-amber-700 text-base">{reviewedCount}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Continue Exam
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
