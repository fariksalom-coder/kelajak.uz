'use client';

import type { LevelResult } from './useTypingStats';

export type CourseProgressProps = {
  /** Индекс текущего уровня (0-based) */
  currentLevelIndex: number;
  levelResults: LevelResult[];
  currentResult?: LevelResult | null;
  className?: string;
};

export default function CourseProgress({
  currentLevelIndex,
  levelResults,
  currentResult,
  className = '',
}: CourseProgressProps) {
  const levelNum = currentLevelIndex + 1;
  const result = currentResult?.level === levelNum
    ? currentResult
    : levelResults.find((r) => r.level === levelNum);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
        Daraja {levelNum}
        {result != null && <span className="text-sky-600">{result.cpm} CPM</span>}
      </span>
    </div>
  );
}
