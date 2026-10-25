'use client';

import React, { useState, useMemo } from 'react';
import { db } from '@/lib/data/mock-db';
import { CourseCard } from '@/components/ui/CourseCard';
import { Search, Filter, BookOpen, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function CoursesPage() {
  const allCourses = db.getCourses(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');

  const categories = ['All', 'Bihar Board', 'CBSE', 'NEET', 'Foundation'];
  const targetClasses = ['All', 'Class 12', 'Class 11', 'Class 10', 'Class 9', 'Repeater/Dropper'];

  const filteredCourses = useMemo(() => {
    return allCourses
      .filter((c) => {
        const matchesSearch =
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.instructor_name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategory === 'All' || c.category === selectedCategory;

        const matchesClass =
          selectedClass === 'All' || c.target_class === selectedClass;

        return matchesSearch && matchesCategory && matchesClass;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [allCourses, searchQuery, selectedCategory, selectedClass, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] rounded-3xl p-8 sm:p-12 text-white shadow-lg space-y-4 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
              Course Catalog
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Explore Academic Courses & Batches
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Targeted preparation for Bihar Board Class 12, CBSE, NEET, and Science
              Foundation. Choose your course, pick a convenient batch schedule, and begin
              learning.
            </p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by subject, chapter, or faculty (e.g. Biology, Shekhar Sir)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#046BD2] focus:ring-1 focus:ring-[#046BD2] bg-slate-50/50"
              />
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 hidden sm:block" />
              <label htmlFor="sort-courses" className="text-xs font-bold text-slate-600 hidden sm:block">
                Sort:
              </label>
              <select
                id="sort-courses"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#046BD2]"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-[#0B192C] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden sm:block" />

            <span className="text-xs font-bold text-slate-500 mr-2 hidden sm:inline">
              Class:
            </span>
            {targetClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedClass === cls
                    ? 'bg-[#046BD2] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => {
              const batches = db.getBatchesForCourse(course.id);
              return <CourseCard key={course.id} course={course} batches={batches} />;
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No courses match your search</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords or switching filters to view all available
              programs.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedClass('All');
              }}
              className="text-xs font-bold text-[#046BD2] hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
