import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    | { courseId?: string; lessonSlug?: string; xp?: number }
    | null;
  const courseId = body?.courseId;
  const lessonSlug = body?.lessonSlug;
  const xp = body?.xp;

  if (!courseId || !lessonSlug || typeof xp !== 'number' || !Number.isFinite(xp) || xp <= 0) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { totalTasks: true } });
  const totalTasks = course?.totalTasks ?? 0;

  // Сохраняем очки и прогресс курса: progress = количество выполненных заданий (инкремент на 1)
  const [user, userCourse] = await prisma.$transaction([
    prisma.user.update({
      where: { id: childId },
      data: { points: { increment: Math.floor(xp) } },
      select: { points: true },
    }),
    prisma.userCourse.upsert({
      where: { userId_courseId: { userId: childId, courseId } },
      create: { userId: childId, courseId, purchased: false, progress: 1 },
      update: { progress: { increment: 1 } },
      select: { progress: true },
    }),
  ]);

  let finalProgress = userCourse.progress;
  if (totalTasks > 0 && userCourse.progress > totalTasks) {
    await prisma.userCourse.update({
      where: { userId_courseId: { userId: childId, courseId } },
      data: { progress: totalTasks },
    });
    finalProgress = totalTasks;
  }

  return NextResponse.json({
    ok: true,
    points: user.points,
    courseId,
    courseProgress: finalProgress,
  });
}

