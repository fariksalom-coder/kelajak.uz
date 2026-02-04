'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useChildId } from '@/contexts/ChildIdContext';
import { useLocale, useTranslations } from 'next-intl';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  titleRu?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

const CARD_COLORS = [
  'bg-pink-100',
  'bg-blue-100',
  'bg-indigo-100',
  'bg-cyan-100',
  'bg-emerald-100',
  'bg-amber-100',
  'bg-rose-100',
  'bg-sky-100',
  'bg-violet-100',
];

export default function ChildMainPage() {
  const childId = useChildId();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations('child');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';

  const courseTitle = (c: CourseItem) =>
    locale === 'ru' ? (c.titleRu ?? c.title) : (c.titleUz ?? c.title);

  useEffect(() => {
    fetch(`/api/child/${childId}/courses`)
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="p-4">Loading...</div>;

  const purchasedCourses = courses.filter((c) => c.purchased);
  const otherCourses = courses.filter((c) => !c.purchased);
  const progressLabel = locale === 'ru' ? '0 из 0' : '0 dan 0';

  const renderCourseGrid = (list: CourseItem[], startColorIndex: number) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {list.map((c, i) => (
        <Link
          key={c.id}
          href={`/${locale}/child/courses/${c.id}${linkSuffix}`}
          className={`rounded-2xl p-4 min-h-[140px] flex flex-col ${CARD_COLORS[(startColorIndex + i) % CARD_COLORS.length]} border border-white/50 shadow-sm`}
        >
          <div className="font-semibold text-gray-800 mb-2 line-clamp-2">
            {courseTitle(c)}
          </div>
          <div className="mt-auto">
            <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(c.progress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-600">
              {progressLabel}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  if (courses.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-gray-600">{t('noCourses')}</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {purchasedCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">{t('myCourses')}</h2>
          {renderCourseGrid(purchasedCourses, 0)}
        </section>
      )}
      <section>
        <h2 className="text-xl font-bold mb-4">{t('otherCourses')}</h2>
        {otherCourses.length > 0 ? (
          renderCourseGrid(otherCourses, purchasedCourses.length)
        ) : (
          <p className="text-gray-600">{t('noCourses')}</p>
        )}
      </section>
    </main>
  );
}
