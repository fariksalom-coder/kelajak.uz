'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Course = {
  id: string;
  title: string;
  titleUz?: string | null;
  price: { toNumber?: () => number } | number;
};

export default function CoursesList({
  courses,
  courseStatus,
  childId,
  prefix,
}: {
  courses: Course[];
  courseStatus: Record<string, { purchased: boolean }>;
  childId: string;
  prefix: string;
  locale?: string;
}) {
  const t = useTranslations('courses');

  const courseTitle = (c: Course) => c.titleUz ?? c.title;
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const price = (c: Course) =>
    typeof c.price === 'object' && c.price && 'toNumber' in c.price
      ? (c.price as { toNumber: () => number }).toNumber()
      : Number(c.price);

  const notPurchased = courses.filter((c) => !courseStatus[c.id]?.purchased);
  const total = notPurchased
    .filter((c) => selected.has(c.id))
    .reduce((s, c) => s + price(c), 0);

  const toggle = (id: string) => {
    if (courseStatus[id]?.purchased) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePay = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    const res = await fetch(`/api/parent/children/${childId}/purchase-courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseIds: Array.from(selected) }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(`${prefix}/parent/children/${childId}/courses`);
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      {courses.map((course) => {
        const purchased = courseStatus[course.id]?.purchased ?? false;
        const isSelected = selected.has(course.id);
        return (
          <div
            key={course.id}
            className={`flex items-center justify-between p-4 border rounded-lg ${
              purchased ? 'bg-gray-50' : ''
            }`}
          >
            <div>
              <div className="font-medium">{courseTitle(course)}</div>
              <div className="text-sm text-gray-600">
                {price(course)} so&apos;m · {purchased ? t('bought') : t('notBought')}
              </div>
            </div>
            {!purchased && (
              <button
                type="button"
                onClick={() => toggle(course.id)}
                className={`px-3 py-1 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'border'
                }`}
              >
                {isSelected ? '✓' : t('select')}
              </button>
            )}
          </div>
        );
      })}
      {selected.size > 0 && (
        <div className="sticky bottom-0 pt-4 border-t bg-white">
          <div className="flex justify-between items-center mb-2">
            <span>{t('total')}: {total} so&apos;m</span>
            <button
              type="button"
              onClick={handlePay}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {t('pay')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
