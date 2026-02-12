'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChildId } from '@/contexts/ChildIdContext';
import { useLocale, useTranslations } from 'next-intl';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
  completedCount?: number;
  totalTasks?: number;
};

const CARD_COLORS = [
  'bg-pink-100',
  'bg-blue-100',
  'bg-indigo-100',
  'bg-cyan-100',
  'bg-emerald-100',
  'bg-amber-100',
  'bg-rose-100',
  'bg-sky-100',
  'bg-violet-100',
];

/** Только математика и финансовая грамотность открыты, остальные — «Скоро». */
function isCourseUnlocked(c: CourseItem): boolean {
  const name = (c.titleUz ?? c.title).toLowerCase();
  if (name.includes('matematika') && !name.includes('maktabgacha')) return true;
  if (name.includes('moliyaviy') || name.includes('savodxonlik')) return true;
  return false;
}

/** Icon/background path by course title (files in public/images/courses/). */
function getCourseIconPath(c: CourseItem): string | null {
  const name = (c.titleUz ?? c.title).toLowerCase();
  if (name.includes('matematika') && !name.includes('maktabgacha')) return '/images/courses/math.png';
  if (name.includes('maktabgacha')) return '/images/courses/maktabgachamatematika.png';
  if (name.includes('moliyaviy') || name.includes('savodxonlik')) return '/images/courses/finance.png';
  if (name.includes('rus tili') || name.includes('русский')) return '/images/courses/russian.png';
  if (name.includes('ingliz') || name.includes('english')) return '/images/courses/english.png';
  if (name.includes('mantiq')) return '/images/courses/logic.png';
  if (name.includes('xotira') || name.includes('memory')) return '/images/courses/xotira.png';
  if (name.includes('qaror qabul') || name.includes('qaror qabul qilish')) return '/images/courses/qaror%20qabul%20qilish.png';
  if (name.includes('geografiya')) return '/images/courses/geografiya.png';
  if (name.includes('mening tanam') || name.includes('tanam')) return '/images/courses/mybody.png';
  return null;
}

export default function ChildMainPage() {
  const childId = useChildId();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('child');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCharLeft, setShowCharLeft] = useState(true);
  const [showCharRight, setShowCharRight] = useState(true);
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';

  const courseTitle = (c: CourseItem) => c.titleUz ?? c.title;

  /** Порядок на главной: математика → финансовая грамотность → русский → английский → остальные → дошкольная математика вниз */
  const courseOrderKey = (c: CourseItem): number => {
    const name = (c.titleUz ?? c.title).toLowerCase();
    if (name.includes('maktabgacha') || name.includes('дошкольн') || name.includes('preschool')) return 5;
    if (name.includes('matematika') || name.includes('математика')) return 0;
    if (name.includes('moliyaviy') || name.includes('savodxonlik') || name.includes('финанс') || name.includes('financial')) return 1;
    if (name.includes('rus tili') || name.includes('русский') || name.includes('russian')) return 2;
    if (name.includes('ingliz') || name.includes('английский') || name.includes('english')) return 3;
    return 4;
  };

  const sortCourses = (list: CourseItem[]) =>
    [...list].sort((a, b) => courseOrderKey(a) - courseOrderKey(b));

  const MATH_COMPLETED_KEY = 'zukko_math1grade_s0_completed';

  const fetchCourses = () => {
    if (!childId) return;
    setLoadError(null);
    setLoading(true);
    fetch(`/api/child/${childId}/courses`, { credentials: 'include' })
      .then((r) => {
        if (r.status === 401) {
          router.replace(`/${locale}/login`);
          return null;
        }
        if (!r.ok) {
          throw new Error(r.status === 403 ? 'Forbidden' : `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then(async (data) => {
        if (data == null) return;
        const list = data.courses ?? [];
        const mathCourse = list.find(
          (c: CourseItem) =>
            ((c.titleUz ?? c.title) || '').toLowerCase().includes('matematika') &&
            !((c.titleUz ?? c.title) || '').toLowerCase().includes('maktabgacha')
        );
        if (mathCourse && childId) {
          try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem(MATH_COMPLETED_KEY) : null;
            const arr = raw ? (JSON.parse(raw) as string[]) : [];
            const localCount = Array.isArray(arr) ? arr.length : 0;
            const apiCount = mathCourse.completedCount ?? 0;
            if (localCount > apiCount) {
              await fetch(`/api/child/${childId}/courses/sync-progress`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: mathCourse.id, completedCount: localCount }),
              });
              const res = await fetch(`/api/child/${childId}/courses`, { credentials: 'include' });
              if (!res.ok) throw new Error('Sync failed');
              const next = await res.json();
              setCourses(next.courses ?? list);
              return;
            }
          } catch {
            // ignore
          }
        }
        setCourses(list);
      })
      .catch((err) => setLoadError(err?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!childId) return;
    fetchCourses();
  }, [childId]);

  if (loading) return <div className="p-4">Loading...</div>;

  if (loadError) {
    return (
      <main className="min-h-full flex flex-col items-center justify-center p-6">
        <p className="text-gray-700 mb-4">{t('coursesLoadError')}</p>
        <button
          type="button"
          onClick={() => fetchCourses()}
          className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium"
        >
          {t('retry')}
        </button>
      </main>
    );
  }

  const allCourses = sortCourses(courses);

  const getProgressLabel = (c: CourseItem) => {
    const total = c.totalTasks ?? 0;
    const done = c.completedCount ?? 0;
    if (total <= 0) return '0 dan 0';
    return `${done} dan ${total}`;
  };

  const getProgressPercent = (c: CourseItem) => {
    const total = c.totalTasks ?? 0;
    const done = c.completedCount ?? 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((done / total) * 100));
  };

  const renderCourseGrid = (list: CourseItem[], startColorIndex: number) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {list.map((c, i) => {
        const bgPath = getCourseIconPath(c);
        const fallbackColor = CARD_COLORS[(startColorIndex + i) % CARD_COLORS.length];
        const cardStyle = bgPath
          ? {
              backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(0,0,0,0.25)), url(${bgPath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined;
        const hasBg = !!bgPath;
        const unlocked = isCourseUnlocked(c);
        const cardClassName = `rounded-2xl p-4 flex flex-col border border-white/50 shadow-sm overflow-hidden aspect-[4/3] min-h-0 relative ${!unlocked ? 'grayscale cursor-not-allowed' : ''} ${!bgPath ? fallbackColor : ''}`;

        if (!unlocked) {
          return (
            <div
              key={c.id}
              className={cardClassName}
              style={cardStyle}
              aria-disabled
            >
              <div className="absolute inset-0 bg-black/45 rounded-2xl" aria-hidden />
              <div className={`font-semibold mb-2 line-clamp-2 text-[1.3rem] relative z-10 ${hasBg ? 'text-blue-900 drop-shadow-md' : 'text-gray-800'}`}>
                {courseTitle(c)}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span className="text-lg font-bold text-white bg-blue-900/90 px-5 py-2 rounded-full shadow-lg">
                  {t('soon')}
                </span>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={c.id}
            href={`/${locale}/child/courses/${c.id}${linkSuffix}`}
            className={cardClassName}
            style={cardStyle}
          >
            <div className={`font-semibold mb-2 line-clamp-2 flex-1 text-[1.3rem] ${hasBg ? 'text-blue-900 drop-shadow-md' : 'text-gray-800'}`}>
              {courseTitle(c)}
            </div>
            <div className="mt-auto">
              <div className="h-3.5 bg-white/60 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${getProgressPercent(c)}%` }}
                />
              </div>
              <div className={`text-xs ${hasBg ? 'text-blue-900/90 drop-shadow' : 'text-gray-600'}`}>
                {getProgressLabel(c)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  if (courses.length === 0) {
    return (
      <main className="min-h-full flex flex-col">
        <header className="relative rounded-b-3xl overflow-hidden px-4 pt-6 pb-8 bg-transparent">
          <div className="flex justify-between items-start pointer-events-none">
            {showCharLeft && (
              <img
                src="/images/character-left.png"
                alt=""
                className="w-20 h-24 object-contain opacity-90"
                onError={() => setShowCharLeft(false)}
              />
            )}
            {!showCharLeft && <div className="w-20" />}
            {showCharRight && (
              <img
                src="/images/character-right.png"
                alt=""
                className="w-20 h-24 object-contain opacity-90"
                onError={() => setShowCharRight(false)}
              />
            )}
            {!showCharRight && <div className="w-20" />}
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-6 flex-1">
          <p className="text-gray-600">{t('noCourses')}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col">
      <header className="relative rounded-b-3xl overflow-hidden px-4 pt-6 pb-8 bg-transparent">
        <div className="flex justify-between items-start pointer-events-none">
          {showCharLeft && (
            <img
              src="/images/character-left.png"
              alt=""
              className="w-20 h-24 object-contain opacity-90"
              onError={() => setShowCharLeft(false)}
            />
          )}
          {!showCharLeft && <div className="w-20" />}
          {showCharRight && (
            <img
              src="/images/character-right.png"
              alt=""
              className="w-20 h-24 object-contain opacity-90"
              onError={() => setShowCharRight(false)}
            />
          )}
          {!showCharRight && <div className="w-20" />}
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6 flex-1">
        <section>
          {allCourses.length > 0 ? (
            renderCourseGrid(allCourses, 0)
          ) : (
            <p className="text-gray-600">{t('noCourses')}</p>
          )}
        </section>
      </div>
    </main>
  );
}
