import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/data/mock-db';
import {
  getCourseBySlug,
  getBatchesForCourseFromDatabase,
  getCurriculumForCourseFromDatabase,
} from '@/lib/data/supabase-service';
import { CourseDetailsClient } from './CourseDetailsClient';

export function generateStaticParams() {
  return db.getCourses(false).map((course) => ({
    slug: course.slug,
  }));
}

export const dynamicParams = true;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const batches = await getBatchesForCourseFromDatabase(course.id);
  const curriculum = await getCurriculumForCourseFromDatabase(course.id);

  return (
    <CourseDetailsClient
      course={course}
      batches={batches}
      curriculum={curriculum}
    />
  );
}
