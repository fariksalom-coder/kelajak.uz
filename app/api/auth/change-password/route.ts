import { NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'allFieldsRequired' }, { status: 400 });
  }
  const { currentPassword, newPassword, confirmPassword } = body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'allFieldsRequired' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'passwordTooShort' }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'passwordsMismatch' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'wrongCurrentPassword' }, { status: 400 });
  }
  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  return NextResponse.json({ ok: true });
}
