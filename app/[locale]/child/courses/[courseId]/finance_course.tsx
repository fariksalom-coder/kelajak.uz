'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

const FINANCE_COMPLETED_KEY = 'zukko_finance_completed';

function getCompletedChapters(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FINANCE_COMPLETED_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** 13 mavzu, har bir qatorda: mavzu + test */
const FINANCE_TOPICS = [
  { id: 1, topic: "Moliyaviy savodxonlik nima?" },
  { id: 2, topic: "Oila byudjeti" },
  { id: 3, topic: "Cho'ntak puli" },
  { id: 4, topic: "Pul tarixi" },
  { id: 5, topic: "Bugungi pul" },
  { id: 6, topic: "Bank kartasi" },
  { id: 7, topic: "Boshqa pullar" },
  { id: 8, topic: "Do'konda" },
  { id: 9, topic: "Pul himoya ostida" },
  { id: 10, topic: "Bank nima?" },
  { id: 11, topic: "Pul to'plash" },
  { id: 12, topic: "Pul va boshqalarga yordam" },
  { id: 13, topic: "Pulni oqilona sarflash" },
] as const;

export default function FinanceCoursePage({
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
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);

  useEffect(() => {
    const refresh = () => setCompletedChapters(getCompletedChapters());
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const isChapterUnlocked = (chapterId: number) => {
    if (chapterId === 1) return true;
    return completedChapters.includes(chapterId - 1);
  };

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

      <p className="text-gray-600 text-sm mb-6">
        Har bir mavzuni o‘qing va keyin testni bajaring.
      </p>

      <div className="space-y-5">
        {FINANCE_TOPICS.map(({ id, topic }) => {
          const unlocked = isChapterUnlocked(id);
          return (
            <div
              key={id}
              className={`rounded-2xl border-2 border-gray-200 bg-white/80 p-4 sm:p-5 shadow-sm ${!unlocked ? 'grayscale opacity-90 pointer-events-none' : ''}`}
            >
              <div className="flex justify-center mb-4">
                <span className="inline-block px-6 py-2 rounded-full bg-blue-500 text-white font-bold text-center">
                  Bo'lim {id}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
                {/* Mavzu: ochiq bo'lsa — test sahifasiga link (mavzu + test bir xil bo'lim) */}
                <div className="flex flex-col items-center">
                  {unlocked ? (
                    <Link
                      href={`${prefix}/child/courses/${course.id}/finance/test/${id}${linkSuffix}`}
                      className="w-full max-w-[200px] flex flex-col items-center group"
                    >
                      <div className="w-full aspect-[2/1] rounded-xl border-2 border-green-500 bg-white flex items-center justify-center shadow-sm group-hover:border-green-600 group-hover:bg-green-50/50 transition-colors">
                        <span className="text-3xl font-bold text-gray-700">{id}</span>
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg whitespace-nowrap">
                        {topic}
                      </span>
                    </Link>
                  ) : (
                    <>
                      <div className="w-full aspect-[2/1] max-w-[200px] rounded-xl border-2 border-green-500 bg-white flex items-center justify-center shadow-sm">
                        <span className="text-3xl font-bold text-gray-700">{id}</span>
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg whitespace-nowrap">
                        {topic}
                      </span>
                    </>
                  )}
                </div>
                {/* Test: ochiq bo'lsa link, yopiq bo'lsa zamok rasm */}
                <div className="flex flex-col items-center">
                  {unlocked ? (
                    <Link
                      href={`${prefix}/child/courses/${course.id}/finance/test/${id}${linkSuffix}`}
                      className="w-full max-w-[200px] flex flex-col items-center group"
                    >
                      <div className="w-full aspect-[2/1] rounded-xl border-2 border-sky-400 bg-white flex items-center justify-center shadow-sm group-hover:border-sky-500 group-hover:bg-sky-50/50 transition-colors">
                        <span className="text-lg font-bold text-sky-600">Test</span>
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg whitespace-nowrap">
                        Test
                      </span>
                    </Link>
                  ) : (
                    <>
                      <div className="w-full aspect-[2/1] max-w-[200px] rounded-xl border-2 border-gray-300 bg-gray-100 flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold text-gray-400">Test</span>
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg whitespace-nowrap">
                        Test
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
