'use client';

const STORAGE_KEY = 'typing-completed-lessons';

export function getCompletedLessonSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.every((x) => typeof x === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

export function isLessonCompleted(slug: string): boolean {
  return getCompletedLessonSlugs().includes(slug);
}

export function markLessonCompleted(slug: string): void {
  try {
    const list = getCompletedLessonSlugs();
    if (list.includes(slug)) return;
    list.push(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
