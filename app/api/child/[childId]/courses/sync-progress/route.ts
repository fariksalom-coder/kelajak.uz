import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** POST body: { courseId: string, completedCount: number } — синхронизирует прогресс курса (например из localStorage математики). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  const { childId } = await params;

  if (role === 'CHILD' && userId !== childId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (role === 'PARENT') {
    const link = await prisma.childParent.findFirst({
      where: { parentId: userId, childId },
    });
    if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { courseId?: string; completedCount?: number }
    | null;
  const courseId = body?.courseId;
  const completedCount = typeof body?.completedCount === 'number' ? Math.max(0, Math.floor(body.completedCount)) : undefined;

  if (!courseId || completedCount === undefined) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { totalTasks: true },
  });
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const totalTasks = course.totalTasks ?? 0;
  const progress = totalTasks > 0 ? Math.min(completedCount, totalTasks) : completedCount;

  await prisma.userCourse.upsert({
    where: { userId_courseId: { userId: childId, courseId } },
    create: { userId: childId, courseId, purchased: false, progress },
    update: { progress },
  });

  return NextResponse.json({ ok: true, progress });
}
