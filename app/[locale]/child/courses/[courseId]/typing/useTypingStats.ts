'use client';

import { useCallback, useState, useEffect } from 'react';

function getStorageKey(lessonSlug: string): string {
  return lessonSlug === 'keys-f-j' ? 'typing-fj-level-results' : `typing-level-results-${lessonSlug}`;
}

export type LevelResult = {
  level: number;
  cpm: number;
  time: number;
};

/**
 * CPM (символов в минуту) по длине задания и времени в секундах.
 * totalTypedChars = длина задания, timeInSeconds = время от первого нажатия до последнего символа.
 */
export function calculateCPM(totalTypedChars: number, timeInSeconds: number): number {
  if (timeInSeconds <= 0) return 0;
  const cpm = (totalTypedChars / timeInSeconds) * 60;
  return Math.max(0, Math.round(cpm));
}

export function loadLevelResults(lessonSlug: string): LevelResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(lessonSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is LevelResult =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as LevelResult).level === 'number' &&
        typeof (x as LevelResult).cpm === 'number' &&
        typeof (x as LevelResult).time === 'number'
    );
  } catch {
    return [];
  }
}

export function saveLevelResult(lessonSlug: string, result: LevelResult): void {
  const list = loadLevelResults(lessonSlug);
  const idx = list.findIndex((r) => r.level === result.level);
  if (idx >= 0) list[idx] = result;
  else list.push(result);
  list.sort((a, b) => a.level - b.level);
  try {
    localStorage.setItem(getStorageKey(lessonSlug), JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function getAverageCPM(results: LevelResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((s, r) => s + r.cpm, 0);
  return Math.round(sum / results.length);
}

export function useTypingStats(lessonSlug: string) {
  const [levelResults, setLevelResults] = useState<LevelResult[]>([]);

  useEffect(() => {
    setLevelResults(loadLevelResults(lessonSlug));
  }, [lessonSlug]);

  const saveResult = useCallback(
    (result: LevelResult) => {
      saveLevelResult(lessonSlug, result);
      setLevelResults(loadLevelResults(lessonSlug));
    },
    [lessonSlug]
  );

  const averageCPM = getAverageCPM(levelResults);

  return { levelResults, saveResult, averageCPM };
}
