import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.id as string;
    const role = (token.role as string) ?? '';
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
      courses: courses.map((c) => {
        const completedCount = byCourse[c.id]?.progress ?? 0;
        const totalTasks = c.totalTasks ?? 0;
        const progressPercent = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0;
        return {
          id: c.id,
          title: c.title,
          titleUz: c.titleUz ?? c.title,
          price: String(c.price),
          purchased: byCourse[c.id]?.purchased ?? false,
          progress: progressPercent,
          completedCount,
          totalTasks,
        };
      }),
    });
  } catch (err) {
    console.error('[GET /api/child/[childId]/courses]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
