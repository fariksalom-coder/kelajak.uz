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

  const user = await prisma.user.findUnique({
    where: { id: childId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      referralCode: true,
      referrals: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { referrals, ...rest } = user;
  return NextResponse.json(
    {
      ...rest,
      referralCode: rest.referralCode ?? null,
      referredUsers: referrals,
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    }
  );
}
