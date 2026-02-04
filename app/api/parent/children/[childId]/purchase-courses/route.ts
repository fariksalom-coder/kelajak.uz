import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  courseIds: z.array(z.string()),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== 'PARENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parentId = (session.user as { id: string }).id;
  const { childId } = await params;
  const link = await prisma.childParent.findFirst({
    where: { parentId, childId },
  });
  if (!link) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { courseIds } = parsed.data;
    for (const courseId of courseIds) {
      await prisma.userCourse.upsert({
        where: {
          userId_courseId: { userId: childId, courseId },
        },
        create: { userId: childId, courseId, purchased: true },
        update: { purchased: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
