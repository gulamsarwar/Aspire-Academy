'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/data/mock-db';
import { addCourseToDatabase, updateCourseInDatabase } from '@/lib/data/supabase-service';
import { Course } from '@/lib/types';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  Users,
  Edit,
  ExternalLink,
  Save,
  Check,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([...db.courses]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [successToast, setSuccessToast] = useState('');

  // New Course Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Bihar Board' | 'CBSE' | 'NEET' | 'Foundation'>('Bihar Board');
  const [newClass, setNewClass] = useState<'Class 12' | 'Class 11' | 'Class 10'>('Class 12');
  const [newPrice, setNewPrice] = useState(499);
  const [newOriginalPrice, setNewOriginalPrice] = useState(1499);
  const [newInstructor, setNewInstructor] = useState('Shekhar Sir');
  const [newDuration, setNewDuration] = useState(24);
  const [newThumbnail, setNewThumbnail] = useState('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80');
  const [newDescription, setNewDescription] = useState('Complete conceptual lectures, chapterwise notes, and high-yield board question practice.');
  const [newPublished, setNewPublished] = useState(true);

  // Edit Course Form State
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editCategory, setEditCategory] = useState<'Bihar Board' | 'CBSE' | 'NEET' | 'Foundation'>('Bihar Board');
  const [editClass, setEditClass] = useState<'Class 12' | 'Class 11' | 'Class 10'>('Class 12');
  const [editPrice, setEditPrice] = useState(499);
  const [editOriginalPrice, setEditOriginalPrice] = useState(1499);
  const [editInstructor, setEditInstructor] = useState('Shekhar Sir');
  const [editDuration, setEditDuration] = useState(24);
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublished, setEditPublished] = useState(true);

  const togglePublish = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const newPublishStatus = !course.published;
    const updated = await updateCourseInDatabase(courseId, { published: newPublishStatus });
    if (updated) {
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, published: newPublishStatus } : c))
      );
      setSuccessToast(`Course status updated to ${newPublishStatus ? 'Published' : 'Draft'}.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const created = await addCourseToDatabase({
      slug,
      title: newTitle,
      subtitle: newSubtitle || 'Comprehensive Board & Entrance Preparation',
      description: newDescription || 'Structured conceptual classes, NCERT line-by-line solutions and chapter tests.',
      category: newCategory,
      target_class: newClass,
      thumbnail_url: newThumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
      price: Number(newPrice),
      original_price: Number(newOriginalPrice),
      currency: 'INR',
      published: newPublished,
      featured: false,
      language: 'Hinglish',
      duration_weeks: Number(newDuration),
      instructor_name: newInstructor,
      instructor_title: 'Senior Faculty',
      features: ['Full Syllabus Video Lectures', 'NCERT Handwritten Notes', 'Chapter PYQ Bank'],
    });

    setCourses([created, ...courses]);
    setShowAddModal(false);
    // Reset fields
    setNewTitle('');
    setNewSubtitle('');
    setSuccessToast(`Course "${created.title}" created successfully! Click "Manage Lessons" to add videos.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditSubtitle(course.subtitle || '');
    setEditCategory((course.category as any) || 'Bihar Board');
    setEditClass((course.target_class as any) || 'Class 12');
    setEditPrice(course.price);
    setEditOriginalPrice(course.original_price);
    setEditInstructor(course.instructor_name);
    setEditDuration(course.duration_weeks);
    setEditThumbnail(course.thumbnail_url);
    setEditDescription(course.description || '');
    setEditPublished(course.published);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const updated = await updateCourseInDatabase(editingCourse.id, {
      title: editTitle,
      subtitle: editSubtitle,
      category: editCategory,
      target_class: editClass,
      price: Number(editPrice),
      original_price: Number(editOriginalPrice),
      instructor_name: editInstructor,
      duration_weeks: Number(editDuration),
      thumbnail_url: editThumbnail,
      description: editDescription,
      published: editPublished,
    });

    if (updated) {
      setCourses((prev) =>
        prev.map((c) => (c.id === editingCourse.id ? { ...c, ...updated } : c))
      );
      setEditingCourse(null);
      setSuccessToast(`Course "${editTitle}" updated successfully.`);
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Course Management
          </h1>
          <p className="text-xs text-slate-500">
            Create, edit, price, and publish educational courses. Manage video lessons and chapters inside each course.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/30 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Courses List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
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
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
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
                      <div className="flex items-center justify-end flex-wrap gap-1.5">
                        {/* 1. Manage Lessons */}
                        <Link
                          href={`/admin/lessons?courseId=${course.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-[#046BD2] hover:bg-blue-100 transition border border-blue-200"
                          title="Manage curriculum and paste video links"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Manage Lessons</span>
                        </Link>

                        {/* 2. Manage Batches */}
                        <Link
                          href={`/admin/batches?courseId=${course.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          title="View and configure batches for this course"
                        >
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Batches</span>
                        </Link>

                        {/* 3. Edit Course */}
                        <button
                          onClick={() => handleOpenEdit(course)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          title="Edit course metadata"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        {/* 4. View Student Preview */}
                        <a
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Open public course catalog preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* 5. Publish Toggle */}
                        <button
                          onClick={() => togglePublish(course.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            course.published
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {course.published ? 'Unpublish' : 'Publish'}
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
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Course</h3>
                <p className="text-xs text-slate-500">
                  Fill in course details. Video lessons are added separately inside Manage Lessons.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 12 Biology — Complete Board & NEET Preparation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Full Syllabus, Chapter PYQs & NCERT Line-by-Line"
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
                  <label className="text-xs font-bold text-slate-700">Course Price (INR) *</label>
                  <input
                    type="number"
                    required
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Lead Faculty</label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Thumbnail URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newThumbnail}
                  onChange={(e) => setNewThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Description</label>
                <textarea
                  rows={2}
                  placeholder="Comprehensive description of what students will learn..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newPublishedCheckbox"
                  checked={newPublished}
                  onChange={(e) => setNewPublished(e.target.checked)}
                  className="w-4 h-4 text-[#046BD2] rounded border-slate-300"
                />
                <label htmlFor="newPublishedCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publish immediately to student catalog
                </label>
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
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Course</h3>
                <p className="text-xs text-slate-500">
                  Update course details and pricing.
                </p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Short Subtitle</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Board / Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
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
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value as any)}
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
                  <label className="text-xs font-bold text-slate-700">Course Price (INR) *</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(editPrice))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Original Price (INR)</label>
                  <input
                    type="number"
                    value={editOriginalPrice}
                    onChange={(e) => setEditOriginalPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Lead Faculty</label>
                  <input
                    type="text"
                    value={editInstructor}
                    onChange={(e) => setEditInstructor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Weeks)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Thumbnail URL</label>
                <input
                  type="text"
                  value={editThumbnail}
                  onChange={(e) => setEditThumbnail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Course Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPublishedCheckbox"
                  checked={editPublished}
                  onChange={(e) => setEditPublished(e.target.checked)}
                  className="w-4 h-4 text-[#046BD2] rounded border-slate-300"
                />
                <label htmlFor="editPublishedCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Published in public student catalog
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
