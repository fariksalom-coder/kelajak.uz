import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const feedbackSchema = z.object({
  childId: z.string(),
  topicId: z.string(),
  understandingLevel: z.enum(['GOOD', 'MEDIUM', 'DIFFICULT']),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== 'PARENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parentId = (session.user as { id: string }).id;
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { childId, topicId, understandingLevel } = parsed.data;
    const link = await prisma.childParent.findFirst({
      where: { parentId, childId },
    });
    if (!link) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const existing = await prisma.topicFeedback.findFirst({
      where: { childId, parentId, topicId },
    });
    if (existing) {
      await prisma.topicFeedback.update({
        where: { id: existing.id },
        data: { understandingLevel },
      });
    } else {
      await prisma.topicFeedback.create({
        data: { childId, parentId, topicId, understandingLevel },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
