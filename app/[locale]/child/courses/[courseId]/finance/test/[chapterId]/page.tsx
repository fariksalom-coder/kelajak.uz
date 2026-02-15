'use client';

import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import Chapter1Gallery from '../Chapter1Gallery';
import Chapter1TestQuiz from '../Chapter1TestQuiz';

const STORAGE_KEY = 'zukko_finance_completed';
export type CompletedPart = number | string;

function getCompletedParts(): CompletedPart[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

function setCompletedParts(parts: CompletedPart[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  } catch {
    // ignore
  }
}

function addCompletedPart(part: CompletedPart) {
  const parts = getCompletedParts();
  if (!parts.includes(part)) {
    setCompletedParts([...parts, part].sort((a, b) => String(a).localeCompare(String(b))));
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

  const handleComplete = () => {
    addCompletedPart(chapterId);
    router.push(backUrl);
  };

  const handleCompleteSlides = () => {
    addCompletedPart('1_slides');
    router.push(backUrl);
  };

  const handleCompleteTest = () => {
    addCompletedPart('1_test');
    router.push(backUrl);
  };

  const isValidChapter = chapterId >= 1 && chapterId <= 13 && Number.isInteger(chapterId);

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

  if (chapterId === 1) {
    const showQuiz = searchParams.get('part') === 'test';
    const testUrl = `${prefix}/child/courses/${courseId}/finance/test/1${linkSuffix ? linkSuffix + '&part=test' : '?part=test'}`;
    if (showQuiz) {
      return <Chapter1TestQuiz backUrl={backUrl} onComplete={handleCompleteTest} />;
    }
    return (
      <Chapter1Gallery
        backUrl={backUrl}
        testUrl={testUrl}
        onCompleteSlides={handleCompleteSlides}
      />
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
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
