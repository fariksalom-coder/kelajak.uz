'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChildIdProvider } from '@/contexts/ChildIdContext';

export default function ChildLayoutClient({
  children,
  locale,
  prefix,
  role,
  userId,
}: {
  children: React.ReactNode;
  locale: string;
  prefix: string;
  role: string;
  userId: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('child');
  const [childId, setChildId] = useState<string | null>(role === 'CHILD' ? userId : null);

  useEffect(() => {
    if (role === 'PARENT') {
      const asChild = searchParams.get('asChild');
      if (!asChild) {
        router.replace(`${prefix}/parent`);
        return;
      }
      fetch(`/api/parent/children/${asChild}/verify`)
        .then((r) => {
          if (r.ok) setChildId(asChild);
          else router.replace(`${prefix}/parent`);
        })
        .catch(() => router.replace(`${prefix}/parent`));
    }
  }, [role, searchParams, prefix, router]);

  useEffect(() => {
    if (!childId) return;
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        role === 'PARENT' ? { minutes: 1, childId } : { minutes: 1 }
      ),
    }).catch(() => {});
  }, [childId, role]);

  const base = `${prefix}/child`;
  const linkSuffix = role === 'PARENT' && childId ? `?asChild=${childId}` : '';
  const isMain = pathname.endsWith('/child') || pathname.endsWith('/child/');
  const isStats = pathname.includes('/stats');
  const isProfile = pathname.includes('/profile');

  if (role === 'PARENT' && !childId) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <ChildIdProvider childId={childId}>
      <div className="flex flex-col min-h-[80vh]">
        <nav className="sticky top-0 z-10 border-b bg-white flex justify-around py-2 shrink-0">
          <Link
            href={`${base}${linkSuffix}`}
            className={`px-4 py-2 ${isMain ? 'text-blue-600 font-medium' : ''}`}
          >
            {t('main')}
          </Link>
          <Link
            href={`${base}/stats${linkSuffix}`}
            className={`px-4 py-2 ${isStats ? 'text-blue-600 font-medium' : ''}`}
          >
            {t('stats')}
          </Link>
          <Link
            href={`${base}/profile${linkSuffix}`}
            className={`px-4 py-2 ${isProfile ? 'text-blue-600 font-medium' : ''}`}
          >
            {t('profile')}
          </Link>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </ChildIdProvider>
  );
}
