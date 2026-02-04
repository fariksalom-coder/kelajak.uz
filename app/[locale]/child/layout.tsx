import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import ChildLayoutClient from './ChildLayoutClient';

export default async function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession();
  const { locale } = await params;
  const prefix = `/${locale}`;

  if (!session) {
    redirect(`${prefix}/login`);
  }

  const role = (session.user as { role: string }).role;
  const userId = (session.user as { id: string }).id;

  return (
    <ChildLayoutClient locale={locale} prefix={prefix} role={role} userId={userId}>
      {children}
    </ChildLayoutClient>
  );
}
