import Link from 'next/link';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function SelectChildPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await getServerSession();
  const { locale } = await params;
  const parentId = (session?.user as { id: string })?.id;
  if (!parentId) return null;

  const links = await prisma.childParent.findMany({
    where: { parentId },
    include: { child: { select: { id: true, firstName: true, lastName: true } } },
  });
  const prefix = `/${locale}`;

  return (
    <main className="max-w-sm mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Bolani tanlang</h1>
      <div className="space-y-2">
        {links.map((l) => (
          <Link
            key={l.child.id}
            href={`${prefix}/child?asChild=${l.child.id}`}
            className="block p-4 border rounded-lg hover:bg-gray-50"
          >
            {l.child.firstName} {l.child.lastName}
          </Link>
        ))}
      </div>
    </main>
  );
}
