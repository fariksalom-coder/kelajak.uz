import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const bodySchema = z.object({
  minutes: z.number().int().min(0).max(24 * 60).default(1),
  childId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const role = (session.user as { role: string }).role;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  let targetUserId = userId;
  if (role === 'PARENT') {
    if (!parsed.success || !parsed.data.childId) {
      return NextResponse.json({ error: 'childId required for parent' }, { status: 400 });
    }
    const link = await prisma.childParent.findFirst({
      where: { parentId: userId, childId: parsed.data.childId },
    });
    if (!link) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    targetUserId = parsed.data.childId;
  }
  try {
    const minutes = parsed.success ? parsed.data.minutes : 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.activityLog.upsert({
      where: {
        userId_date: { userId: targetUserId, date: today },
      },
      create: { userId: targetUserId, date: today, minutes },
      update: { minutes: { increment: minutes } },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
