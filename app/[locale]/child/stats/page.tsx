'use client';

import { useEffect, useState } from 'react';
import { useChildId } from '@/contexts/ChildIdContext';
import { useTranslations } from 'next-intl';

type Stats = {
  points: number;
  level: string;
  levelProgress: number;
  pointsInLevel: number;
  pointsToNextLevel: number;
  weeklyActivity: Record<string, number>;
  courseProgress: Array<{ courseId: string; title: string; titleUz?: string; progress: number }>;
};

const DAY_KEYS = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri', 'daySat', 'daySun'] as const;

export default function ChildStatsPage() {
  const childId = useChildId();
  const t = useTranslations('child');
  const [stats, setStats] = useState<Stats | null>(null);

  const courseTitle = (cp: { title: string; titleUz?: string }) =>
    cp.titleUz ?? cp.title;

  const levelName = (level: string) => {
    const key = level === 'Beginner' ? 'levelBeginner' : level === 'Intermediate' ? 'levelIntermediate' : 'levelAdvanced';
    return t(key);
  };

  useEffect(() => {
    fetch(`/api/child/${childId}/stats`)
      .then((r) => r.json())
      .then(setStats);
  }, [childId]);

  if (!stats) return <div className="p-4">Loading...</div>;

  const today = new Date();
  const weekEntries: Array<[string, number]> = [];
  for (let d = 6; d >= 0; d--) {
    const dte = new Date(today);
    dte.setDate(today.getDate() - d);
    const key = dte.toISOString().slice(0, 10);
    weekEntries.push([key, stats.weeklyActivity[key] ?? 0]);
  }
  const maxMinutes = Math.max(...weekEntries.map(([, m]) => m), 1);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">{t('stats')}</h1>

      <section className="mb-8">
        <h2 className="font-medium mb-2">{t('level')}: {levelName(stats.level)}</h2>
        <div className="text-sm text-gray-600 mb-1">
          {stats.pointsInLevel} / {stats.pointsToNextLevel} {t('points')}
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${stats.levelProgress}%` }}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-medium mb-3">{t('weeklyActivity')}</h2>
        <div className="flex gap-2 items-end justify-between">
          {weekEntries.map(([date, minutes], i) => (
            <div key={date} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-200 rounded-t min-h-[4px]"
                style={{ height: `${(minutes / maxMinutes) * 60}px` }}
              />
              <span className="text-xs mt-1">{t(DAY_KEYS[i] ?? 'dayMon')}</span>
              <span className="text-xs text-gray-500">{minutes} m</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-medium mb-3">{t('progressByCourse')}</h2>
        <ul className="space-y-3">
          {stats.courseProgress.map((cp) => (
            <li key={cp.courseId} className="border rounded-xl p-4 bg-gray-50/80">
              <div className="font-medium text-gray-800 mb-2">{courseTitle(cp)}</div>
              <div className="text-sm text-gray-600 mb-1">
                {t('completed')}: {cp.progress}% · 0 {t('progressCount')} 0
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(cp.progress, 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        {stats.courseProgress.length === 0 && (
          <p className="text-gray-600 text-sm">{t('noProgress')}</p>
        )}
      </section>
    </main>
  );
}
