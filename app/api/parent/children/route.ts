import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const addChildSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.number().int().min(1).max(18).nullable().optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== 'PARENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const parsed = addChildSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    const { firstName, lastName, age, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'emailTaken' }, { status: 400 });
    }
    const passwordHash = await hash(password, 10);
    const child = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'CHILD',
        age: age ?? undefined,
      },
    });
    await prisma.childParent.create({
      data: {
        parentId: (session.user as { id: string }).id,
        childId: child.id,
      },
    });
    return NextResponse.json({ ok: true, childId: child.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
