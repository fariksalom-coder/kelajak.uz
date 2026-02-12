'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import RotateDeviceOverlay from '@/components/lesson/RotateDeviceOverlay';
import { requestLandscape, useLandscapeForTask } from '@/hooks/useLandscapeForTask';

const STORAGE_KEY = 'zukko_finance_completed';

function getCompleted(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setCompleted(chapters: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
  } catch {
    // ignore
  }
}

function FinanceTestContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const courseId = (params?.courseId as string) ?? '';
  const chapterId = Number(params?.chapterId);
  const linkSuffix = searchParams.get('asChild') ? `?asChild=${searchParams.get('asChild')}` : '';
  const prefix = `/${locale}`;
  const backUrl = courseId ? `${prefix}/child/courses/${courseId}${linkSuffix}` : `${prefix}/child${linkSuffix}`;
  const containerRef = useRef<HTMLElement>(null);
  const { showRotatePrompt } = useLandscapeForTask({
    containerRef,
    isActive: !!params?.chapterId && chapterId >= 1 && chapterId <= 13,
  });

  const isValidChapter = chapterId >= 1 && chapterId <= 13 && Number.isInteger(chapterId);

  useEffect(() => {
    if (containerRef.current && isValidChapter) {
      requestLandscape(containerRef.current);
    }
  }, [isValidChapter]);

  const handleComplete = () => {
    const completed = getCompleted();
    if (!completed.includes(chapterId)) {
      setCompleted([...completed, chapterId].sort((a, b) => a - b));
    }
    router.push(backUrl);
  };

  if (!params?.chapterId) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-gray-600 animate-pulse">Yuklanmoqda...</div>
        <Link href={backUrl} className="mt-4 inline-block text-blue-600 underline">
          Orqaga
        </Link>
      </main>
    );
  }

  if (!isValidChapter) {
    return (
      <main className="max-w-lg mx-auto px-4 py-8">
        <p className="text-gray-600 mb-4">Bunday bo&apos;lim topilmadi.</p>
        <Link href={backUrl} className="text-blue-600 underline">
          Kursga qaytish
        </Link>
      </main>
    );
  }

  return (
    <div className="relative min-h-full">
      {showRotatePrompt && <RotateDeviceOverlay />}
      <main ref={containerRef} className="max-w-lg mx-auto px-4 py-8">
        <header className="flex items-center gap-3 mb-8">
          <Link
            href={backUrl}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200 shrink-0"
            aria-label="Orqaga"
          >
            <span className="text-xl leading-none">←</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Bo&apos;lim {chapterId} — Test</h1>
        </header>

        <p className="text-gray-600 mb-6">
          Test mazmuni tez orada qo&apos;shiladi. Demo rejimida tugatish tugmasini bosing.
        </p>

        <button
          type="button"
          onClick={handleComplete}
          className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md"
        >
          Testni tugatish
        </button>
      </main>
    </div>
  );
}

export default function FinanceTestPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-lg mx-auto px-4 py-8">
          <div className="text-gray-600 animate-pulse">Yuklanmoqda...</div>
        </main>
      }
    >
      <FinanceTestContent />
    </Suspense>
  );
}
