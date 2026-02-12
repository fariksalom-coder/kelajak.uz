'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useChildId } from '@/contexts/ChildIdContext';
import { useLocale } from 'next-intl';
import Math1Grade from './math_1grade';
import RussianCoursePage from './russian_course';
import FinanceCoursePage from './finance_course';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

/** Kurs turi boʻyicha: Matematika → math_1grade, Rus tili → russian_course, qolganlari → “tez orada” */
export default function CourseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const childId = useChildId();
  const locale = useLocale();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/child/${childId}/courses`)
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="p-4">Loading...</div>;

  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-gray-600">Kurs topilmadi.</p>
        <Link href={`/${locale}/child${linkSuffix}`} className="text-blue-600 mt-2 inline-block">
          Orqaga
        </Link>
      </main>
    );
  }

  const rawName = (course.titleUz ?? course.title) ?? '';
  const courseName = rawName.toLowerCase().replace(/[\u2018\u2019\u0027\u0060]/g, "'");
  const isMatematika =
    courseName.includes('matematika') || courseName.includes('математика');
  const isRusTili =
    courseName.includes('rus tili') ||
    courseName.includes('ruski') ||
    courseName.includes('русский') ||
    courseName.includes('russian');
  const financeCourse = courses.find((c) => {
    const n = ((c.titleUz ?? c.title) ?? '').toLowerCase();
    return n.includes('moliyaviy') || n.includes('savodxonlik') || n.includes('moliya') || n.includes('financial');
  });
  const isMoliyaviy = financeCourse != null && course.id === financeCourse.id;

  if (isMatematika) {
    return <Math1Grade />;
  }

  if (isRusTili) {
    return (
      <RussianCoursePage
        course={course}
        locale={locale}
        linkSuffix={linkSuffix}
      />
    );
  }

  if (isMoliyaviy) {
    return (
      <FinanceCoursePage
        course={course}
        locale={locale}
        linkSuffix={linkSuffix}
      />
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <header className="flex items-center gap-3 mb-4">
        <Link
          href={`/${locale}/child${linkSuffix}`}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200 shrink-0"
          aria-label="Orqaga"
        >
          <span className="text-xl leading-none">←</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">{course.titleUz ?? course.title}</h1>
      </header>
      <div className="py-8 text-gray-500 text-center">
        Kurs mazmuni tez orada qoʻshiladi.
      </div>
    </main>
  );
}
