import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
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
  return NextResponse.json({ ok: true });
}
