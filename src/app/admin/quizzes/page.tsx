'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/data/mock-db';
import { parseWordQuizContent, ParseResult } from '@/lib/quiz/docx-parser';
import { QuizQuestion, Quiz } from '@/lib/types';
import { MathRenderer } from '@/components/ui/MathRenderer';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Trash2,
  Save,
  Eye,
  Edit,
  Check,
  HelpCircle,
  Clock,
  Award,
  Loader2,
  BookOpen,
  Archive,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

export default function AdminQuizzesPage() {
  const courses = db.courses;
  const batches = db.batches;

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [chapterId, setChapterId] = useState('Chapter 01');
  const [quizTitle, setQuizTitle] = useState('');
  const [targetClass, setTargetClass] = useState('Class 12th Board');
  const [subject, setSubject] = useState('Biology');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [attemptLimit, setAttemptLimit] = useState(3);
  const [instructions, setInstructions] = useState('Read each question carefully. Select the most appropriate option. Avoid negative marking.');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [quizStatus, setQuizStatus] = useState<'draft' | 'published' | 'archived'>('published');

  // Filter batches for selected course
  const courseBatches = batches.filter((b) => !selectedCourseId || b.course_id === selectedCourseId);

  // Raw text / file content input
  const [rawInput, setRawInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Parsed Questions state for editing & preview
  const [parsedQuestions, setParsedQuestions] = useState<QuizQuestion[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Existing Quizzes list
  const [existingQuizzes, setExistingQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const json = await res.json();
        setExistingQuizzes(json.quizzes || []);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Sample Hindi & Math Quiz template for quick testing
  const loadSampleDocx = () => {
    const sample = `Aspire Academy Online - Model Test 01

1. The phenotypic dihybrid cross ratio according to Mendel's law of independent assortment is:
(A) 3:1
(B) 9:3:3:1
(C) 1:2:1
(D) 9:7
Ans: B
Explanation: The classic Mendelian dihybrid ratio produces 9 (dominant/dominant), 3 (dominant/recessive), 3 (recessive/dominant), and 1 (recessive/recessive).

2. DNA द्वि-कुंडली संरचना (Double Helix Model) का प्रतिपादन किसने किया था?
(A) वाटसन एवं क्रिक (Watson & Crick)
(B) मेंडल (Mendel)
(C) डार्विन (Darwin)
(D) लैमार्क (Lamarck)
Ans: A
Explanation: James Watson और Francis Crick ने 1953 में DNA की द्विकुंडली संरचना की खोज की थी।

3. The frequency of dominant allele is p = 0.6. According to Hardy-Weinberg equation p^2 + 2pq + q^2 = 1, what is the heterozygous frequency?
(A) 0.36
(B) 0.48
(C) 0.16
(D) 0.24
Ans: B
Explanation: Since p = 0.6, q = 1 - 0.6 = 0.4. The heterozygous frequency 2pq = 2 * 0.6 * 0.4 = 0.48.

4. Find the value of \\sqrt{16} + \\frac{1}{2} x when x = 4:
(A) 4
(B) 6
(C) 8
(D) 10
Ans: B
Explanation: \\sqrt{16} = 4, and \\frac{1}{2}(4) = 2. 4 + 2 = 6.`;

    setRawInput(sample);
    setQuizTitle('Biology & Mathematical Genetics Mock Test 01');
    setFileName('Sample_Genetics_Test.docx');
    handleParseContent(sample);
  };

  // Handle server-side file upload for true .docx binary processing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/quizzes/parse-docx', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server failed to parse Word document.');
      }

      const json = await res.json();
      if (!quizTitle) {
        setQuizTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setParsedQuestions(json.questions || []);
      setParseErrors(json.errors || []);
      if (json.extractedPreview) {
        setRawInput(json.extractedPreview);
      }
    } catch (err: any) {
      alert(`Could not read or parse Word file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Trigger parser on direct pasted text
  const handleParseContent = (content: string) => {
    const result: ParseResult = parseWordQuizContent(content);
    setParsedQuestions(result.questions);
    setParseErrors(result.errors);
  };

  // Question manipulation
  const handleQuestionChange = (index: number, field: string, value: any) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setParsedQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = { ...opts[optIndex], text: value };
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_custom_${Date.now()}`,
      question_number: parsedQuestions.length + 1,
      question_text: 'New Question Text (KaTeX math supported: $x^2 + y^2 = r^2$ or Hindi text)',
      options: [
        { id: 'A', key: 'A', text: 'Option A' },
        { id: 'B', key: 'B', text: 'Option B' },
        { id: 'C', key: 'C', text: 'Option C' },
        { id: 'D', key: 'D', text: 'Option D' },
      ],
      correct_option: 'A',
      marks: marksPerQuestion,
      negative_marks: negativeMarking,
      explanation: '',
    };
    setParsedQuestions((prev) => [...prev, newQ]);
  };

  const handleDeleteQuestion = (index: number) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Quiz (either as Draft or Published)
  const handleSaveQuiz = async (statusOverride?: 'draft' | 'published' | 'archived') => {
    if (!quizTitle.trim()) {
      alert('Please enter a Quiz Title.');
      return;
    }
    if (parsedQuestions.length === 0) {
      alert('Please import or add at least one question.');
      return;
    }

    // Validation checks
    const targetStatus = statusOverride || quizStatus;
    if (targetStatus === 'published') {
      for (let i = 0; i < parsedQuestions.length; i++) {
        const q = parsedQuestions[i];
        if (!q.question_text.trim()) {
          alert(`Validation Error: Question #${i + 1} has empty description text.`);
          return;
        }
        if (!q.options || q.options.length < 2) {
          alert(`Validation Error: Question #${i + 1} must have at least 2 options.`);
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correct_option)) {
          alert(`Validation Error: Question #${i + 1} has no correct option selected. Please select A, B, C, or D in preview.`);
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      const totalMarks = parsedQuestions.reduce((sum, q) => sum + (Number(q.marks) || marksPerQuestion), 0);

      const payload = {
        title: quizTitle,
        description: `Aspire Academy examination with ${parsedQuestions.length} questions, Hindi/English bilingual support, and LaTeX formulas.`,
        course_id: selectedCourseId,
        batch_id: selectedBatchId || undefined,
        chapter_id: chapterId || undefined,
        target_class: targetClass,
        subject: subject,
        duration_minutes: Number(durationMinutes),
        total_marks: totalMarks,
        marks_per_question: Number(marksPerQuestion),
        negative_marking: Number(negativeMarking),
        passing_percentage: Number(passingPercentage),
        attempt_limit: Number(attemptLimit),
        instructions: instructions.trim(),
        randomize_questions: randomizeQuestions,
        status: targetStatus,
        published: targetStatus === 'published',
        questions: parsedQuestions,
      };

      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save quiz');
      }

      setSaveSuccess(
        `Quiz "${quizTitle}" successfully saved as ${targetStatus.toUpperCase()} with ${parsedQuestions.length} questions!`
      );
      setTimeout(() => setSaveSuccess(''), 6000);
      fetchQuizzes();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Change existing quiz status (publish, unpublish, archive)
  const handleUpdateQuizStatus = async (quizId: string, newStatus: 'published' | 'draft' | 'archived') => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          published: newStatus === 'published',
        }),
      });

      if (!res.ok) throw new Error('Failed to update quiz status');
      fetchQuizzes();
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    }
  };

  // Delete quiz
  const handleDeleteQuiz = async (quizId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete quiz "${title}"?`)) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete quiz');
      fetchQuizzes();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#046BD2] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Word (.docx) & LaTeX Math MCQ Importer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quiz & Question Bank Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Microsoft Word (.docx) documents import karein, Hindi Devanagari aur KaTeX formula preview karein, answer keys verify karein aur student exam portal me publish karein.
          </p>
        </div>

        <button
          onClick={loadSampleDocx}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200 self-start sm:self-auto shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Load Bilingual Math Sample</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 1. Quiz Settings & Document Import Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#046BD2]" />
          <span>Step 1: Test Metadata & Word Document Upload</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select Course <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedBatchId('');
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:border-[#046BD2]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Link Batch (Optional)
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:border-[#046BD2]"
            >
              <option value="">All Enrolled Batches</option>
              {courseBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Test Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 1 Genetics Mock Test"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Chapter / Unit
            </label>
            <input
              type="text"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              placeholder="e.g. Chapter 01 Principles of Inheritance"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Subject & Class
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
              />
              <input
                type="text"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                placeholder="Class"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Duration & Passing %
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">min</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Marks & Negative Penalty
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={marksPerQuestion}
                  onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">marks</span>
              </div>
              <div className="relative">
                <select
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 text-[11px] bg-slate-50 focus:outline-none focus:border-[#046BD2]"
                >
                  <option value={0}>0 (No Neg)</option>
                  <option value={0.25}>-0.25 (1/4th)</option>
                  <option value={0.33}>-0.33 (1/3rd)</option>
                  <option value={0.5}>-0.5 (Half)</option>
                  <option value={1}>-1.0 (Full)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Attempt Policy & Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={attemptLimit}
                onChange={(e) => setAttemptLimit(Number(e.target.value))}
                className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-[#046BD2]"
              >
                <option value={1}>1 Attempt</option>
                <option value={2}>2 Attempts</option>
                <option value={3}>3 Attempts</option>
                <option value={5}>5 Attempts</option>
                <option value={999}>Unlimited</option>
              </select>
              <select
                value={quizStatus}
                onChange={(e) => setQuizStatus(e.target.value as any)}
                className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold focus:outline-none focus:border-[#046BD2]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Instructions & Randomization Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Test Instructions for Students
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Read each question carefully. Select the most appropriate option. Avoid negative marking."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="randomizeQuestionsCheckbox"
              checked={randomizeQuestions}
              onChange={(e) => setRandomizeQuestions(e.target.checked)}
              className="w-4 h-4 text-[#046BD2] rounded border-slate-300"
            />
            <label htmlFor="randomizeQuestionsCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
              Randomize question order for students
            </label>
          </div>
        </div>

        {/* File Drag and Drop or Direct Paste */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <label className="flex-1 w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-blue-300 hover:border-[#046BD2] bg-blue-50/40 cursor-pointer transition text-xs font-bold text-[#046BD2]">
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#046BD2]" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>
                {isParsing
                  ? 'Parsing Word Document (.docx)...'
                  : fileName
                  ? `Uploaded: ${fileName}`
                  : 'Upload Word (.docx / .txt) Document (Hindi, English, OMML Math)'}
              </span>
              <input
                type="file"
                accept=".docx,.txt,.doc"
                onChange={handleFileUpload}
                disabled={isParsing}
                className="hidden"
              />
            </label>

            <span className="text-xs font-bold text-slate-400 uppercase">OR</span>

            <button
              onClick={() => handleParseContent(rawInput)}
              className="px-5 py-3.5 rounded-2xl font-bold text-xs bg-[#046BD2] text-white hover:bg-[#0352A0] transition shadow-sm whitespace-nowrap"
            >
              Parse Pasted Text Below
            </button>
          </div>

          <div>
            <textarea
              rows={5}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste questions here with numbering (1, 2, 3), options ((A), (B), (C), (D)), and answer keys (Ans: B or उत्तर: क)..."
              className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#046BD2] resize-y bg-slate-50/50 leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive KaTeX Preview & Question Editor */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              <span>Step 2: KaTeX Math Preview & Inline Question Correction</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review extracted questions, verify Hindi font readability, check KaTeX equations, and ensure answer keys are set.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>

            <button
              onClick={() => handleSaveQuiz('draft')}
              disabled={isSaving || parsedQuestions.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Save as Draft</span>
            </button>

            <button
              onClick={() => handleSaveQuiz('published')}
              disabled={isSaving || parsedQuestions.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Publish Quiz ({parsedQuestions.length} Qs)</span>
            </button>
          </div>
        </div>

        {/* Validation Errors banner */}
        {parseErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Parser Validation Notices ({parseErrors.length})</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
              {parseErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions Editor & KaTeX Preview List */}
        {parsedQuestions.length > 0 ? (
          <div className="space-y-6">
            {parsedQuestions.map((q, qIndex) => {
              const hasAnswer = ['A', 'B', 'C', 'D'].includes(q.correct_option);

              return (
                <div
                  key={q.id || qIndex}
                  className={`p-5 rounded-2xl border transition space-y-4 ${
                    !hasAnswer
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-[#046BD2] text-white font-bold text-xs flex items-center justify-center">
                        {qIndex + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        Question #{qIndex + 1}
                      </span>
                      {!hasAnswer && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Answer Key Missing! Select radio button below.
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(qIndex)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text Editor & KaTeX Render */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Question Text (Supports Hindi & KaTeX LaTeX formulas like $x^2 + y^2 = 1$):
                      </label>
                      <textarea
                        rows={3}
                        value={q.question_text}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#046BD2] bg-white resize-y"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-emerald-700 block mb-1">
                        KaTeX Live Preview:
                      </label>
                      <div className="p-3 rounded-xl border border-emerald-200 bg-white min-h-[72px] text-xs font-semibold text-slate-900 leading-relaxed">
                        <MathRenderer content={q.question_text} />
                      </div>
                    </div>
                  </div>

                  {/* Options Editor */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Options (Select radio button for Correct Answer):
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correct_option === opt.key;

                        return (
                          <div
                            key={opt.key || optIndex}
                            className={`p-3 rounded-xl border flex items-center gap-2.5 bg-white transition ${
                              isCorrect
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                                : 'border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_opt_${qIndex}`}
                              checked={isCorrect}
                              onChange={() => handleQuestionChange(qIndex, 'correct_option', opt.key || opt.id)}
                              className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                            />
                            <span className="font-bold text-xs text-slate-800 w-4">
                              {opt.key || opt.id}:
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Solution & Mathematical Explanation
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                      placeholder="Provide step-by-step formula derivation or NCERT chapter reference..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2] bg-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No Questions Parsed Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Load Bilingual Math Sample&quot; or upload a Word document to inspect and edit questions before publishing.
            </p>
          </div>
        )}
      </div>

      {/* 3. Existing Quizzes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Existing Academy Test Series</span>
          </h2>
          <button
            onClick={fetchQuizzes}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingQuizzes ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#046BD2] animate-spin" />
          </div>
        ) : existingQuizzes.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {existingQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#046BD2] bg-blue-50 px-2 py-0.5 rounded">
                      {quiz.subject || 'Biology'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {quiz.target_class || 'Class 12th'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        quiz.status === 'draft'
                          ? 'bg-amber-100 text-amber-800'
                          : quiz.status === 'archived'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {quiz.status || (quiz.published ? 'Published' : 'Draft')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{quiz.title}</h4>
                  <p className="text-xs text-slate-500">
                    Duration: {quiz.duration_minutes} mins • Total Marks: {quiz.total_marks} • Negative: -{quiz.negative_marking || 0} • Questions: {quiz.questions?.length || quiz.questions_count || 0}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {quiz.status === 'published' || quiz.published ? (
                    <button
                      onClick={() => handleUpdateQuizStatus(quiz.id, 'draft')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateQuizStatus(quiz.id, 'published')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                    >
                      Publish
                    </button>
                  )}

                  {quiz.status !== 'archived' && (
                    <button
                      onClick={() => handleUpdateQuizStatus(quiz.id, 'archived')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Archive
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4">No published quizzes yet.</p>
        )}
      </div>
    </div>
  );
}
