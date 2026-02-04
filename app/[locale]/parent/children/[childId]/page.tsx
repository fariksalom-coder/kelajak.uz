import Link from 'next/link';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function ParentChildPage({
  params,
}: {
  params: Promise<{ locale: string; childId: string }>;
}) {
  const session = await getServerSession();
  const { locale, childId } = await params;
  const parentId = (session?.user as { id: string })?.id;
  if (!parentId) return null;

  const link = await prisma.childParent.findFirst({
    where: { parentId, childId },
    include: {
      child: {
        include: {
          userCourses: { include: { course: true } },
        },
      },
    },
  });
  if (!link) notFound();

  const child = link.child;
  const prefix = `/${locale}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-2">
        {child.firstName} {child.lastName}
      </h1>
      <div className="text-gray-600 mb-6">
        Ball: {child.points} · Kurslar: {child.userCourses.length}
      </div>
      <div className="space-y-3">
        <Link
          href={`${prefix}/parent/children/${childId}/recent`}
          className="block w-full py-3 text-center border rounded-lg hover:bg-gray-50"
        >
          So&apos;nggi o&apos;rganilganlar
        </Link>
        <Link
          href={`${prefix}/parent/children/${childId}/courses`}
          className="block w-full py-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Bolaga kurs sotib olish
        </Link>
      </div>
    </main>
  );
}
