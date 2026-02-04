import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { nanoid } from '@/lib/nanoid';

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
  role: z.enum(['CHILD', 'PARENT']),
  ref: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordsMismatch',
  path: ['confirmPassword'],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message;
      return NextResponse.json(
        { error: typeof msg === 'string' ? msg : 'allFieldsRequired' },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, password, role, ref } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'emailTaken' }, { status: 400 });
    }
    const passwordHash = await hash(password, 10);
    const referralCode = nanoid(8);
    let referredById: string | undefined;
    if (ref) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: ref },
        select: { id: true },
      });
      if (referrer) referredById = referrer.id;
    }
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role,
        referralCode,
        referredById,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Register error:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: 'serverError',
        ...(process.env.NODE_ENV === 'development' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
