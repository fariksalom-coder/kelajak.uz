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
  const isLesson = pathname.includes('/lesson/');

  if (role === 'PARENT' && !childId) {
    return <div className="p-4">Loading...</div>;
  }

  const navLinkClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl min-w-[64px] transition-colors ${
      active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
    }`;

  const NavIcon = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
    <span className="text-current">{children}</span>
  );

  const layoutBgStyle = {
    background: 'linear-gradient(180deg, #93c5fd 0%, #60a5fa 40%, #3b82f6 100%)',
    minHeight: '100vh',
  };

  return (
    <ChildIdProvider childId={childId}>
      <div className="flex flex-col min-h-screen" style={layoutBgStyle}>
        {!isLesson && (
          <nav className="sticky top-0 z-10 bg-blue-900 border-b border-blue-800 shadow-[0_2px_10px_rgba(0,0,0,0.2)] flex justify-around items-stretch py-2 px-2">
            <Link href={`${base}${linkSuffix}`} className={navLinkClass(isMain)}>
              <NavIcon active={isMain}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </NavIcon>
              <span className="text-xs font-medium">{t('main')}</span>
            </Link>
            <Link href={`${base}/stats${linkSuffix}`} className={navLinkClass(isStats)}>
              <NavIcon active={isStats}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 19v-5h2v5H4zm5 0v-8h2v8H9zm5 0v-3h2v3h-2zm5 0v-6h2v6h-2z" />
                </svg>
              </NavIcon>
              <span className="text-xs font-medium">{t('stats')}</span>
            </Link>
            <Link href={`${base}/profile${linkSuffix}`} className={navLinkClass(isProfile)}>
              <NavIcon active={isProfile}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </NavIcon>
              <span className="text-xs font-medium">{t('profile')}</span>
            </Link>
          </nav>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </ChildIdProvider>
  );
}
