import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const LEVELS = [
  { name: 'Beginner', min: 0, max: 500 },
  { name: 'Intermediate', min: 500, max: 1500 },
  { name: 'Advanced', min: 1500, max: 3000 },
];

export async function GET(
  _request: Request,
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

  const user = await prisma.user.findUnique({
    where: { id: childId },
    select: { points: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const points = user.points;
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i]!.min) {
      currentLevel = LEVELS[i]!;
      nextLevel = LEVELS[i + 1] ?? LEVELS[i]!;
    }
  }
  const progressInLevel = nextLevel ? Math.min(points - currentLevel.min, nextLevel.max - currentLevel.min) : 0;
  const maxInLevel = nextLevel ? nextLevel.max - currentLevel.min : currentLevel.max;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const logs = await prisma.activityLog.findMany({
    where: { userId: childId, date: { gte: weekStart } },
  });
  const activityByDay: Record<string, number> = {};
  for (let d = 0; d < 7; d++) {
    const dte = new Date(weekStart);
    dte.setDate(weekStart.getDate() + d);
    const key = dte.toISOString().slice(0, 10);
    activityByDay[key] = logs.find((l) => {
      const logDate = l.date instanceof Date ? l.date : new Date(l.date);
      return logDate.toISOString().slice(0, 10) === key;
    })?.minutes ?? 0;
  }

  const allCourses = await prisma.course.findMany({
    orderBy: { orderIndex: 'asc' },
  });
  const userCourses = await prisma.userCourse.findMany({
    where: { userId: childId },
  });
  const progressByCourse = Object.fromEntries(
    userCourses.map((uc) => [uc.courseId, uc.progress])
  );

  const courseProgress = allCourses.map((c) => ({
    courseId: c.id,
    title: c.title,
    titleUz: c.titleUz ?? c.title,
    progress: progressByCourse[c.id] ?? 0,
  }));

  return NextResponse.json({
    points,
    level: currentLevel.name,
    levelProgress: maxInLevel > 0 ? Math.round((progressInLevel / maxInLevel) * 100) : 100,
    pointsInLevel: progressInLevel,
    pointsToNextLevel: maxInLevel,
    weeklyActivity: activityByDay,
    courseProgress,
  });
}
