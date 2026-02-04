import Link from 'next/link';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { useTranslations } from 'next-intl';
import ParentDashboard from './ParentDashboard';

export default async function ParentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession();
  const { locale } = await params;
  const prefix = `/${locale}`;
  const parentId = (session?.user as { id: string })?.id;
  if (!parentId) return null;

  const links = await prisma.childParent.findMany({
    where: { parentId },
    include: {
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          points: true,
          userCourses: {
            include: { course: true },
          },
        },
      },
    },
  });
  const children = links.map((l) => l.child);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Kelajak.uz</h1>
      <ParentDashboard
        childrenList={children}
        locale={locale}
        prefix={prefix}
      />
    </main>
  );
}
