'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  points: number;
  userCourses: Array<{ course: { title: string }; progress: number }>;
};

export default function ParentDashboard({
  childrenList,
  locale,
  prefix,
}: {
  childrenList: Child[];
  locale: string;
  prefix: string;
}) {
  const t = useTranslations('parent');

  if (childrenList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-6">{t('noChildren')}</p>
        <Link
          href={`${prefix}/parent/children/add`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('addFirstChild')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {childrenList.map((child) => (
          <Link
            key={child.id}
            href={`${prefix}/parent/children/${child.id}`}
            className="block p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">
              {child.firstName} {child.lastName}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {child.points} ball · {child.userCourses.length} kurs
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {child.userCourses.length} kurs
            </div>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`${prefix}/parent/children/add`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('addChild')}
        </Link>
        <Link
          href={`${prefix}/parent/children/select`}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          {t('goToChildProfile')}
        </Link>
      </div>
    </div>
  );
}
