'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

/** Rus tili kursi: roʻyxatdagi darslar (doʻstingiz yozgan reading-russian-1) */
export default function RussianCoursePage({
  course,
  locale,
  linkSuffix,
}: {
  course: CourseItem;
  locale: string;
  linkSuffix: string;
}) {
  const courseTitle = course.titleUz ?? course.title;
  const prefix = `/${locale}`;

  const lessons = [
    { slug: 'reading-russian-1', label: 'Oʻqish (ruscha) 1', description: 'Harflar va soʻzlar' },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-4">
      <header className="flex items-center gap-3 mb-6">
        <Link
          href={`${prefix}/child${linkSuffix}`}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200 shrink-0"
          aria-label="Orqaga"
        >
          <span className="text-xl leading-none">←</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">{courseTitle}</h1>
      </header>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <Link
            key={lesson.slug}
            href={`${prefix}/child/courses/${course.id}/lesson/${lesson.slug}${linkSuffix}`}
            className="block rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm hover:border-sky-300 hover:bg-sky-50/50 transition-colors"
          >
            <div className="font-semibold text-gray-800">{lesson.label}</div>
            {lesson.description && (
              <div className="text-sm text-gray-500 mt-1">{lesson.description}</div>
            )}
            <span className="inline-block mt-2 text-sky-600 font-medium text-sm">
              Boshlash →
            </span>
          </Link>
        ))}
      </div>

      <p className="text-gray-500 text-sm mt-6">
        Boshqa darslar tez orada qoʻshiladi.
      </p>
    </main>
  );
}
