'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { Course } from '@/lib/types';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Edit,
  Eye,
  Check,
  Video,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([...db.courses]);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Bihar Board' | 'CBSE' | 'NEET' | 'Foundation'>('Bihar Board');
  const [newClass, setNewClass] = useState<'Class 12' | 'Class 11' | 'Class 10'>('Class 12');
  const [newPrice, setNewPrice] = useState(499);
  const [newOriginalPrice, setNewOriginalPrice] = useState(1499);
  const [newInstructor, setNewInstructor] = useState('Shekhar Sir');
  const [newDuration, setNewDuration] = useState(24);

  const togglePublish = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const updated = db.updateCourse(courseId, { published: !course.published });
    if (updated) {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, published: !c.published } : c))
      );
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const created = db.addCourse({
      slug,
      title: newTitle,
      subtitle: newSubtitle || 'Comprehensive Board & Entrance Preparation',
      description: 'Structured conceptual classes, NCERT line-by-line solutions and chapter tests.',
      category: newCategory,
      target_class: newClass,
      thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
      price: Number(newPrice),
      original_price: Number(newOriginalPrice),
      currency: 'INR',
      published: true,
      featured: false,
      language: 'Hinglish',
      duration_weeks: Number(newDuration),
      instructor_name: newInstructor,
      instructor_title: 'Senior Faculty',
      features: ['Full Syllabus Video Lectures', 'NCERT Handwritten Notes', 'Chapter PYQ Bank'],
    });

    setCourses([created, ...courses]);
    setShowAddModal(false);
    // Reset
    setNewTitle('');
    setNewSubtitle('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs text-slate-500">
            Create, edit, price, and publish educational courses in the public catalog.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/lessons"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
          >
            <Video className="w-4 h-4" />
            <span>Paste Video Link Now</span>
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Courses List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Course Info</th>
                <th className="px-6 py-4">Class & Board</th>
                <th className="px-6 py-4">Price (INR)</th>
                <th className="px-6 py-4">Batches</th>
                <th className="px-6 py-4">Catalog Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((course) => {
                const batches = db.getBatchesForCourse(course.id);

                return (
                  <tr key={course.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-slate-900 text-sm max-w-xs truncate">
                            {course.title}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Faculty: {course.instructor_name} • {course.duration_weeks} wks
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">
                        {course.target_class}
                      </span>
                      <span className="text-[10px] text-slate-500">{course.category}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-black text-slate-900 text-sm block">
                        ₹{course.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{course.original_price.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">
                        {batches.length} Batches
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {course.published ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          <XCircle className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/lessons?courseId=${course.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-[#046BD2] hover:bg-blue-100 transition border border-blue-200"
                          title="Paste YouTube video links and manage lessons for this course"
                        >
                          <Video className="w-3.5 h-3.5 text-red-600" />
                          <span>Paste Video Link</span>
                        </Link>
                        <button
                          onClick={() => togglePublish(course.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            course.published
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {course.published ? 'Unpublish' : 'Publish Live'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create New Course</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 12 Mathematics — Bihar Board Topper Batch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Calculus, Vectors, Probability & Solved Question Bank"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Board / Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Bihar Board">Bihar Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="NEET">NEET</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Class</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Class 12">Class 12</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 10">Class 10</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Course Price (INR)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Original Price (INR)</label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lead Faculty</label>
                <input
                  type="text"
                  value={newInstructor}
                  onChange={(e) => setNewInstructor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm"
                >
                  Create & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
