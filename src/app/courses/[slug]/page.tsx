import React from 'react';
import type { Metadata } from 'next';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Course Not Found — Aspire Academy',
    };
  }

  return {
    title: `${course.title} — Aspire Academy`,
    description:
      course.description ||
      `Enroll in ${course.title} at Aspire Academy with Shekhar Sir. Live batches, chapter-wise lectures, and handwritten PDF notes.`,
    openGraph: {
      title: `${course.title} — Aspire Academy`,
      description: course.description,
      images: course.thumbnail_url ? [{ url: course.thumbnail_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${course.title} — Aspire Academy`,
      description: course.description,
    },
  };
}

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
