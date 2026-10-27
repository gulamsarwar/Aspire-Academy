import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/data/mock-db';
import {
  getCourseBySlug,
  getBatchesForCourseFromDatabase,
} from '@/lib/data/supabase-service';
import { CheckoutClient } from './CheckoutClient';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ batchId?: string }>;
}) {
  const { slug } = await params;
  const { batchId } = await searchParams;

  const course = await getCourseBySlug(slug);
  if (!course) {
    notFound();
  }

  const batches = await getBatchesForCourseFromDatabase(course.id);
  const selectedBatch = batches.find((b) => b.id === batchId) || batches[0];

  return (
    <CheckoutClient
      course={course}
      batches={batches}
      initialBatchId={selectedBatch?.id || ''}
    />
  );
}
