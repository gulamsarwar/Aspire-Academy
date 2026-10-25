import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/data/mock-db';
import { CoursePlayerClient } from './CoursePlayerClient';

export const dynamic = 'force-dynamic';

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = db.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const curriculum = db.getCurriculumForCourse(course.id);
  const liveClasses = db.liveClasses.filter((lc) => lc.course_id === course.id);
  const announcements = db.announcements.filter(
    (a) => a.course_id === course.id || !a.course_id
  );

  return (
    <CoursePlayerClient
      course={course}
      curriculum={curriculum}
      liveClasses={liveClasses}
      announcements={announcements}
    />
  );
}
