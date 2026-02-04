import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import RecentContent from './RecentContent';

export default async function RecentPage({
  params,
}: {
  params: Promise<{ locale: string; childId: string }>;
}) {
  const session = await getServerSession();
  const { childId } = await params;
  const parentId = (session?.user as { id: string })?.id;
  if (!parentId) return null;

  const link = await prisma.childParent.findFirst({
    where: { parentId, childId },
  });
  if (!link) notFound();

  const subjects = await prisma.subject.findMany({
    orderBy: { order: 'asc' },
    include: {
      topics: { orderBy: { order: 'asc' } },
    },
  });

  const existingFeedback = await prisma.topicFeedback.findMany({
    where: { childId, parentId },
  });
  const feedbackByTopic = Object.fromEntries(
    existingFeedback.map((f) => [f.topicId, f.understandingLevel])
  );

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">So&apos;nggi o&apos;rganilganlar</h1>
      <RecentContent
        subjects={subjects}
        childId={childId}
        feedbackByTopic={feedbackByTopic}
      />
    </main>
  );
}
