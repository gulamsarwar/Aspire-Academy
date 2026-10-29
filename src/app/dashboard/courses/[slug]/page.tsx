import { redirect } from 'next/navigation';

export default async function DashboardCourseSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/dashboard/courses/${slug}/learn`);
}

