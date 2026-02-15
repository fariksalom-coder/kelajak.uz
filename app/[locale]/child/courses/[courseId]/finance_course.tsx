'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';

/** Rasm papkasi: public/courses/finance/ — 1.png, 2.png, ... 13.png (har bir bo'lim uchun) */
const FINANCE_IMAGE_BASE = '/courses/finance';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

const FINANCE_COMPLETED_KEY = 'zukko_finance_completed';
type CompletedPart = number | string;

function getCompletedParts(): CompletedPart[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FINANCE_COMPLETED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return [];
    const hasStrings = arr.some((x) => typeof x === 'string');
    if (hasStrings) return arr as CompletedPart[];
    const nums = arr as number[];
    const migrated: CompletedPart[] = [];
    for (const n of nums) {
      if (n === 1) {
        if (!migrated.includes('1_slides')) migrated.push('1_slides');
        if (!migrated.includes('1_test')) migrated.push('1_test');
      } else if (typeof n === 'number' && n >= 2 && n <= 13) {
        migrated.push(n);
      }
    }
    return migrated;
  } catch {
    return [];
  }
}

function isPartCompleted(parts: CompletedPart[], part: CompletedPart): boolean {
  return parts.includes(part);
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
  const [completedParts, setCompletedParts] = useState<CompletedPart[]>([]);
  const [imageFailed, setImageFailed] = useState<Set<number>>(new Set());
  const onImageError = useCallback((id: number) => {
    setImageFailed((prev) => new Set(prev).add(id));
  }, []);

  useEffect(() => {
    const refresh = () => setCompletedParts(getCompletedParts());
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const isChapterUnlocked = (chapterId: number) => {
    if (chapterId === 1) return true;
    if (chapterId === 2) {
      return isPartCompleted(completedParts, '1_slides') && isPartCompleted(completedParts, '1_test');
    }
    return isPartCompleted(completedParts, chapterId - 1);
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
          const materialDone =
            id === 1
              ? isPartCompleted(completedParts, '1_slides')
              : isPartCompleted(completedParts, id);
          const testDone =
            id === 1
              ? isPartCompleted(completedParts, '1_test')
              : isPartCompleted(completedParts, id);
          return (
            <div
              key={id}
              className={`rounded-2xl border-2 border-gray-200 bg-white/80 p-4 sm:p-5 shadow-sm ${!unlocked ? 'grayscale opacity-90 pointer-events-none' : ''}`}
            >
              <div className="flex justify-center mb-4">
                <span className="inline-block px-6 py-2 rounded-full bg-blue-500 text-white font-bold text-center">
                  Bo&apos;lim {id}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start">
                {/* Mavzu */}
                <div className="flex flex-col items-center relative">
                  {materialDone && (
                    <span
                      className="absolute -top-1 -right-1 sm:right-[calc(50%-100px-8px)] z-10 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow"
                      aria-hidden
                    >
                      ✓
                    </span>
                  )}
                  {unlocked ? (
                    <Link
                      href={`${prefix}/child/courses/${course.id}/finance/test/${id}${linkSuffix}`}
                      className="w-full max-w-[200px] flex flex-col items-center group"
                    >
                      <div className="w-full aspect-[2/1] rounded-xl border-2 border-green-500 bg-white flex items-center justify-center overflow-hidden shadow-sm group-hover:border-green-600 group-hover:bg-green-50/50 transition-colors relative">
                        {imageFailed.has(id) ? (
                          <span className="text-3xl font-bold text-gray-700">{id}</span>
                        ) : (
                          <Image
                            src={`${FINANCE_IMAGE_BASE}/${id}.png`}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="200px"
                            onError={() => onImageError(id)}
                          />
                        )}
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg whitespace-nowrap">
                        {topic}
                      </span>
                    </Link>
                  ) : (
                    <>
                      <div className="w-full aspect-[2/1] max-w-[200px] rounded-xl border-2 border-green-500 bg-white flex items-center justify-center overflow-hidden shadow-sm relative">
                        {imageFailed.has(id) ? (
                          <span className="text-3xl font-bold text-gray-700">{id}</span>
                        ) : (
                          <Image
                            src={`${FINANCE_IMAGE_BASE}/${id}.png`}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="200px"
                            onError={() => onImageError(id)}
                          />
                        )}
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg whitespace-nowrap">
                        {topic}
                      </span>
                    </>
                  )}
                </div>
                {/* Test */}
                <div className="flex flex-col items-center relative">
                  {testDone && (
                    <span
                      className="absolute -top-1 -right-1 sm:right-[calc(50%-100px-8px)] z-10 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow"
                      aria-hidden
                    >
                      ✓
                    </span>
                  )}
                  {unlocked ? (
                    <Link
                      href={
                        id === 1
                          ? `${prefix}/child/courses/${course.id}/finance/test/1${linkSuffix ? linkSuffix + '&part=test' : '?part=test'}`
                          : `${prefix}/child/courses/${course.id}/finance/test/${id}${linkSuffix}`
                      }
                      className="w-full max-w-[200px] flex flex-col items-center group"
                    >
                      <div className="w-full aspect-[2/1] rounded-xl border-2 border-sky-400 bg-white flex items-center justify-center shadow-sm group-hover:border-sky-500 group-hover:bg-sky-50/50 transition-colors">
                        <span className="text-lg font-bold text-sky-600">Test</span>
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg">
                        Test
                      </span>
                    </Link>
                  ) : (
                    <>
                      <div className="w-full aspect-[2/1] max-w-[200px] rounded-xl border-2 border-gray-300 bg-gray-100 flex items-center justify-center shadow-sm">
                        <span className="text-lg font-bold text-gray-400">Test</span>
                      </div>
                      <span className="mt-2 text-center font-medium text-gray-800 text-base sm:text-lg">
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
