import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/data/mock-db';
import { CourseDetailsClient } from './CourseDetailsClient';

export function generateStaticParams() {
  return db.getCourses(false).map((course) => ({
    slug: course.slug,
  }));
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = db.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const batches = db.getBatchesForCourse(course.id);
  const curriculum = db.getCurriculumForCourse(course.id);

  return (
    <CourseDetailsClient
      course={course}
      batches={batches}
      curriculum={curriculum}
    />
  );
}
