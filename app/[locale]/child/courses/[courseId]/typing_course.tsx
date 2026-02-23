'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TYPING_SECTIONS } from './typing-data/lessons';
import type { TypingLessonData } from './typing-data/types';
import LessonCPMBadge from './typing/LessonCPMBadge';
import { getCompletedLessonSlugs } from './typing/typingProgress';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

const MOBILE_BREAKPOINT = 768;

/** Все уроки подряд */
const allLessons = TYPING_SECTIONS.flatMap((s) =>
  s.lessons.map((l) => ({ ...l, sectionTitle: s.sectionTitle }))
);

const CARDS_PER_ROW = 3;
const CARD_SIZE = 150;
const GAP = 24;

export default function TypingCoursePage({
  course,
  locale,
  linkSuffix,
}: {
  course: CourseItem;
  locale: string;
  linkSuffix: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const courseTitle = course.titleUz ?? course.title;
  const prefix = `/${locale}`;
  const params = useParams();
  const courseId = (params?.courseId as string) ?? course.id;

  useEffect(() => {
    setCompletedSlugs(getCompletedLessonSlugs());
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const completedSet = new Set(completedSlugs);

  if (isMobile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-md rounded-2xl bg-white border-2 border-sky-200 shadow-lg p-6 text-center">
          <p className="text-lg text-gray-800 font-medium leading-relaxed">
            Ushbu kursda o&apos;qish uchun kompyuterdan oching. TezYoz kursi barmoqlar bilan yozishni o&apos;rganish uchun klaviatura kerak.
          </p>
          <Link
            href={`${prefix}/child${linkSuffix}`}
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium"
          >
            Orqaga
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-4">
      <header className="flex items-center gap-3 mb-6">
        <Link
          href={`${prefix}/child${linkSuffix}`}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200 shrink-0"
          aria-label="Back"
        >
          <span className="text-xl leading-none">←</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">{courseTitle}</h1>
      </header>

      {allLessons.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Darslar tez orada qoʻshiladi.</p>
      ) : (
        <div
          className="grid w-full pb-6"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_SIZE}px, 1fr))`,
            gap: GAP,
          }}
        >
          {allLessons.map((lesson, i) => {
            const lessonData = lesson as TypingLessonData & { sectionTitle: string };
            const lessonNumber = i + 1;
            const prevCompleted = i === 0 || completedSet.has((allLessons[i - 1] as TypingLessonData).slug);
            const isLocked = !prevCompleted;
            const startNewRow = i > 0 && (allLessons[i - 1] as TypingLessonData).title === 'Takrorlash';
            return (
              <div
                key={lessonData.slug}
                className="flex flex-col items-center justify-start"
                style={startNewRow ? { gridColumn: 1 } : undefined}
              >
                {isLocked ? (
                  <div
                    className="w-[150px] h-[150px] rounded-2xl border-2 border-gray-200 bg-gray-100 shadow flex flex-col items-center justify-center p-3 text-center relative cursor-not-allowed opacity-75"
                    title="Avvalgi darsni bajaring"
                    aria-disabled
                  >
                    <span
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 text-xs font-bold"
                      aria-hidden
                    >
                      {lessonNumber}
                    </span>
                    <span className="absolute top-2 right-2 text-gray-400" aria-hidden>
                      🔒
                    </span>
                    <span className="font-semibold text-gray-500 text-sm leading-tight line-clamp-2">
                      {lessonData.title}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`${prefix}/child/courses/${courseId}/lesson/${lessonData.slug}${linkSuffix}`}
                    className="w-[150px] h-[150px] rounded-2xl border-2 border-gray-200 bg-white shadow-md hover:border-sky-400 hover:shadow-lg hover:scale-105 transition-all flex flex-col items-center justify-center p-3 text-center relative"
                  >
                    <span
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 text-xs font-bold"
                      aria-hidden
                    >
                      {lessonNumber}
                    </span>
                    <span className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                      {lessonData.title}
                    </span>
                    <LessonCPMBadge lessonSlug={lessonData.slug} lessonKeys={lessonData.keys} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
