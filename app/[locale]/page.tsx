import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import Link from 'next/link';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession();
  const base = `/${locale}`;
  if ((session?.user as { role?: string })?.role === 'PARENT') {
    redirect(`${base}/parent`);
  }
  if ((session?.user as { role?: string })?.role === 'CHILD') {
    redirect(`${base}/child`);
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Kelajak.uz</h1>
      <div className="flex gap-4">
        <Link
          href={`/${locale}/login`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Kirish
        </Link>
        <Link
          href={`/${locale}/register`}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
        >
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </div>
    </main>
  );
}
