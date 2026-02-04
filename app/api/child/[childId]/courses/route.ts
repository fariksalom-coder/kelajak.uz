import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const courses = await prisma.course.findMany({
    orderBy: { orderIndex: 'asc' },
  });
  const userCourses = await prisma.userCourse.findMany({
    where: { userId: childId },
    include: { course: true },
  });
  const byCourse = Object.fromEntries(
    userCourses.map((uc) => [uc.courseId, { purchased: uc.purchased, progress: uc.progress }])
  );

  return NextResponse.json({
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      titleUz: c.titleUz ?? c.title,
      titleRu: c.titleRu ?? c.title,
      price: String(c.price),
      purchased: byCourse[c.id]?.purchased ?? false,
      progress: byCourse[c.id]?.progress ?? 0,
    })),
  });
}
