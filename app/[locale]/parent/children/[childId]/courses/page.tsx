import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import CoursesList from './CoursesList';

export default async function ChildCoursesPage({
  params,
}: {
  params: Promise<{ locale: string; childId: string }>;
}) {
  const session = await getServerSession();
  const { locale, childId } = await params;
  const t = await getTranslations('parent');
  const parentId = (session?.user as { id: string })?.id;
  if (!parentId) return null;

  const link = await prisma.childParent.findFirst({
    where: { parentId, childId },
  });
  if (!link) notFound();

  const courses = await prisma.course.findMany({
    orderBy: { orderIndex: 'asc' },
  });
  const userCourses = await prisma.userCourse.findMany({
    where: { userId: childId },
  });
  const purchasedIds = new Set(
    userCourses.filter((uc) => uc.purchased).map((uc) => uc.courseId)
  );
  const courseStatus = Object.fromEntries(
    userCourses.map((uc) => [uc.courseId, { purchased: uc.purchased }])
  );

  const prefix = `/${locale}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">{t('buyCourse')}</h1>
      <CoursesList
        courses={courses}
        courseStatus={courseStatus}
        childId={childId}
        prefix={prefix}
      />
    </main>
  );
}
