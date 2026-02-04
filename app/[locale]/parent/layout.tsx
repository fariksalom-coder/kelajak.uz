import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function ParentLayout({
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
  if ((session.user as { role: string }).role !== 'PARENT') {
    redirect(`${prefix}/child`);
  }
  return <>{children}</>;
}
