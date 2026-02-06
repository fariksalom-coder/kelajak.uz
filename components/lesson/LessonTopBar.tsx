'use client';

import Link from 'next/link';
import ProgressDots from './ProgressDots';

const TEXTS = {
  back: 'Orqaga',
} as const;

export default function LessonTopBar({
  backHref,
  progressTotal = 5,
  progressCurrent = 1,
}: {
  backHref: string;
  progressTotal?: number;
  progressCurrent?: number;
}) {
  return (
    <header className="flex items-center justify-between w-full px-4 py-3 bg-white border-b border-gray-100">
      <Link
        href={backHref}
        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
      >
        <span className="text-lg leading-none" aria-hidden>←</span>
        {TEXTS.back}
      </Link>
      <ProgressDots total={progressTotal} current={progressCurrent} />
    </header>
  );
}
