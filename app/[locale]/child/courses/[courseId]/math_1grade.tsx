'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import CharacterAvatar from '@/components/lesson/CharacterAvatar';
import Cube from '@/components/lesson/Cube';
import TaskScreen from '@/components/lesson/TaskScreen';
import { useChildId } from '@/contexts/ChildIdContext';
import { useLocale } from 'next-intl';
import { MATH_TAB0_SECTIONS } from './math-1grade-data/sections-tab0';
import { MATH_TAB1_SECTIONS } from './math-1grade-data/sections-tab1';
import { MATH_TAB5_SECTIONS } from './math-1grade-data/sections-tab5';
import type { LessonStatus } from './math-1grade-data/types';

/** Bo‘lim va qism indeksiga qarab rasm papkasi (public/courses/math-1grade/...). */
function getTaskImageBaseUrl(tabIndex: number, sectionIdx: number): string {
  const base = '/courses/math-1grade';
  if (tabIndex === 0) {
    const parts = [
      '1-kosmik-sarguzasht',
      '2-buyumlarni-qayta-sanash',
      '3-nom-beriladi-1',
      '4-nom-beriladi-2',
      '5-nom-beriladi-3',
      '6-nom-beriladi-4',
      '7-topshiriq-2-quyi',
      '8-topshiriq-5-quyi',
      '9-sonlar-11-20',
      '10-vaqt',
      '11-massa',
      '12-hajm',
    ];
    const folder = parts[sectionIdx] ?? '1-kosmik-sarguzasht';
    return `${base}/1-raqamlar-va-miqdorlar/${folder}`;
  }
  if (tabIndex === 1) {
    const folder = ['1-nom-beriladi-1', '2-nom-beriladi-2', '3-nom-beriladi-3', '4-nom-beriladi-4'][sectionIdx] ?? '1-nom-beriladi-1';
    return `${base}/2-qoshish-va-ayirish/${folder}`;
  }
  if (tabIndex === 4) {
    const folder = ['1-nom-beriladi-1', '2-nom-beriladi-2', '3-nom-beriladi-3', '4-nom-beriladi-4'][sectionIdx] ?? '1-nom-beriladi-1';
    return `${base}/5-matnli-masalalar/${folder}`;
  }
  return `${base}/1-raqamlar-va-miqdorlar/1-kosmik-sarguzasht`;
}

type SelectedLesson = {
  tabIndex: number;
  sectionIdx: number;
  lessonIdx: number;
  lessonLabel: string;
  subsectionTitle?: string;
};

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

// Matematika kursi bo‘limlari
const MATH_SECTION_NAMES = [
  'Raqamlar va miqdorlar',
  "Qo'shish va ayirish",
  'Geometriya',
  "Ma'lumot bilan ishlash",
  'Matnli masalalar',
  'Laboratoriya',
] as const;

const COMPLETED_LESSONS_KEY = 'zukko_math1grade_s0_completed';

function getCompletedLessons(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(COMPLETED_LESSONS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function setCompletedLessonsStorage(keys: Set<string>) {
  try {
    const arr: string[] = [];
    keys.forEach((k) => arr.push(k));
    localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function reportLessonCompleteToApi(childId: string | null, courseId: string, lessonKey: string) {
  if (!childId) return;
  fetch(`/api/child/${childId}/lesson-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, lessonSlug: `math-${lessonKey}`, xp: 10 }),
  }).catch(() => {});
}

const SECTION_0_LESSON_COUNT = 3; // Boshlash, Sayyorani, Raketani tuzat

// sectionIdx 0 = Block 1, 1 = Block 2, 2 = Block 3, 3 = Block 4

/** Block 1 (sectionIdx 0 — Kosmik sarguzasht): kartochka statusi */
function getBlock1LessonStatus(lessonIdx: number, completedLessons: Set<string>): LessonStatus {
  const key = `0-${lessonIdx}`;
  if (completedLessons.has(key)) return 'completed';
  for (let j = 0; j < lessonIdx; j++) {
    if (!completedLessons.has(`0-${j}`)) return 'locked';
  }
  return 'current';
}

/** Block 1 tugagach Block 2 ochiladi */
function isBlock1Complete(completedLessons: Set<string>): boolean {
  for (let j = 0; j < SECTION_0_LESSON_COUNT; j++) {
    if (!completedLessons.has(`0-${j}`)) return false;
  }
  return true;
}

/** Block 2 (sectionIdx 1 — Buyumlarni qayta sanash): kartochka statusi */
function getBlock2LessonStatus(lessonIdx: number, completedLessons: Set<string>): LessonStatus {
  const key = `1-${lessonIdx}`;
  if (completedLessons.has(key)) return 'completed';
  for (let j = 0; j < lessonIdx; j++) {
    if (!completedLessons.has(`1-${j}`)) return 'locked';
  }
  return 'current';
}

/** Block 2 tugagach Block 3 ochiladi */
const BLOCK2_LAST_LESSON = 2;
function isBlock2Complete(completedLessons: Set<string>): boolean {
  for (let j = 0; j <= BLOCK2_LAST_LESSON; j++) {
    if (!completedLessons.has(`1-${j}`)) return false;
  }
  return true;
}

/** Block 3 (sectionIdx 2): kartochka statusi — Block 2 tugagach ochiladi */
function getBlock3LessonStatus(lessonIdx: number, completedLessons: Set<string>): LessonStatus {
  if (!isBlock2Complete(completedLessons)) return 'locked';
  const key = `2-${lessonIdx}`;
  if (completedLessons.has(key)) return 'completed';
  for (let j = 0; j < lessonIdx; j++) {
    if (!completedLessons.has(`2-${j}`)) return 'locked';
  }
  return 'current';
}

function isBlock3Complete(completedLessons: Set<string>): boolean {
  return completedLessons.has('2-0') && completedLessons.has('2-1');
}

/** Block 4 (sectionIdx 3): kartochka statusi — Block 3 tugagach ochiladi */
function getBlock4LessonStatus(lessonIdx: number, completedLessons: Set<string>): LessonStatus {
  if (!isBlock3Complete(completedLessons)) return 'locked';
  const key = `3-${lessonIdx}`;
  if (completedLessons.has(key)) return 'completed';
  for (let j = 0; j < lessonIdx; j++) {
    if (!completedLessons.has(`3-${j}`)) return 'locked';
  }
  return 'current';
}


export default function CourseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.courseId as string;
  const childId = useChildId();
  const locale = useLocale();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState<SelectedLesson | null>(null);
  const [lessonScreen, setLessonScreen] = useState<'start' | 'content'>('start');
  const [block3Task1Stage, setBlock3Task1Stage] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => getCompletedLessons());
  const sectionsScrollRef = useRef<HTMLDivElement>(null);
  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';

  const openLesson = (sectionIdx: number, lessonIdx: number, lessonLabel: string, subsectionTitle?: string) => {
    setSelectedLesson({ tabIndex: activeTab, sectionIdx, lessonIdx, lessonLabel, subsectionTitle });
    setLessonScreen('start');
  };

  // Block 3 task 1: yangi dars ochilganda etapni 0 qilamiz
  useEffect(() => {
    setBlock3Task1Stage(0);
  }, [selectedLesson]);

  const closeLesson = () => {
    setSelectedLesson(null);
  };

  // Boshlang‘ich oynada audio — boshlash tugmasiga qadar davom etadi
  useEffect(() => {
    if (!selectedLesson || lessonScreen !== 'start') return;
    const baseUrl = getTaskImageBaseUrl(selectedLesson.tabIndex, selectedLesson.sectionIdx);
    const audio = new Audio(`${baseUrl}/start.mp3`);
    audio.volume = 0.7; // 30% pastroq
    audio.loop = true;
    audio.play().catch(() => {});
    startAudioRef.current = audio;
    return () => {
      audio.pause();
      startAudioRef.current = null;
    };
  }, [selectedLesson, lessonScreen]);

  const handleStartClick = () => {
    startAudioRef.current?.pause();
    startAudioRef.current = null;
    setLessonScreen('content');
  };

  const scrollSections = (direction: 'left' | 'right') => {
    const el = sectionsScrollRef.current;
    if (!el) return;
    const step = 200;
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!childId) return;
    fetch(`/api/child/${childId}/courses`)
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) return <div className="p-4">Loading...</div>;

  const course = courses.find((c) => c.id === courseId);
  const courseTitle = course ? (course.titleUz ?? course.title) : '';

  if (!course) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-gray-600">Kurs topilmadi.</p>
        <Link href={`/${locale}/child${linkSuffix}`} className="text-blue-600 mt-2 inline-block">
          Orqaga
        </Link>
      </main>
    );
  }

  const courseName = (course.titleUz ?? course.title).toLowerCase();
  const isMatematika =
    courseName.includes('matematika') || courseName.includes('математика');
  const prefix = `/${locale}`;

  return (
    <main className="max-w-4xl mx-auto px-4 py-4">
      <header className="flex items-center gap-3 mb-4">
        <Link
          href={`${prefix}/child${linkSuffix}`}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200 shrink-0"
          aria-label="Orqaga"
        >
          <span className="text-xl leading-none">←</span>
        </Link>
        <h1 className="text-xl font-bold text-gray-800">{courseTitle}</h1>
      </header>

      {!isMatematika && (
        <div className="py-8 text-gray-500 text-center">
          Kurs mazmuni tez orada qo‘shiladi.
        </div>
      )}

      {isMatematika && (
        <>
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => scrollSections('left')}
              className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              aria-label="Chapga"
            >
              <span className="text-lg leading-none">‹</span>
            </button>
            <div
              ref={sectionsScrollRef}
              className="flex gap-2 overflow-x-auto pb-2 flex-1 min-w-0"
            >
              {MATH_SECTION_NAMES.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap border-2 transition-colors ${
                    i === activeTab
                      ? 'border-blue-500 text-blue-700 bg-white'
                      : 'border-transparent bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollSections('right')}
              className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              aria-label="O'ngga"
            >
              <span className="text-lg leading-none">›</span>
            </button>
          </div>

          {[0, 1, 4].includes(activeTab) && (() => {
            const sections = activeTab === 0 ? MATH_TAB0_SECTIONS : activeTab === 1 ? MATH_TAB1_SECTIONS : MATH_TAB5_SECTIONS;
            return sections.length > 0 ? (
            <div className="space-y-8">
              {sections.map((section, sectionIdx) => (
                <section key={sectionIdx} className="mb-8">
                  {sectionIdx === 0 ? (
                    <>
                      {section.sectionTitle && (
                        <div className="rounded-xl bg-gray-100 px-4 py-3 mb-2">
                          <h2 className="font-semibold text-gray-800">{section.sectionTitle}</h2>
                        </div>
                      )}
                      {section.subsectionTitle && (
                        <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                      )}
                    </>
                  ) : (
                    <>
                      {section.sectionTitle && (
                        <h2 className="font-bold text-gray-800 mb-4">{section.sectionTitle}</h2>
                      )}
                      {section.subsectionTitle && (
                        <h3 className="font-bold text-gray-800 mb-4">{section.subsectionTitle}</h3>
                      )}
                    </>
                  )}
                  {section.lessons.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {section.lessons.map((lesson, i) => {
                        // Block 1–4: status completedLessons bo'yicha (sectionIdx 0=Block1, 1=Block2, 2=Block3, 3=Block4)
                        const effectiveStatus =
                          activeTab === 0 && sectionIdx === 0
                            ? getBlock1LessonStatus(i, completedLessons)
                            : activeTab === 0 && sectionIdx === 1
                              ? getBlock2LessonStatus(i, completedLessons)
                              : activeTab === 0 && sectionIdx === 2
                                ? getBlock3LessonStatus(i, completedLessons)
                                : activeTab === 0 && sectionIdx === 3
                                  ? getBlock4LessonStatus(i, completedLessons)
                                  : lesson.status;
                        const isOpenableBlock1 = activeTab === 0 && sectionIdx === 0 && (i === 0 || i === 1 || i === 2);
                        const isOpenableBlock2 = activeTab === 0 && sectionIdx === 1 && (i === 0 || i === 1 || i === 2);
                        const isOpenableBlock3 = activeTab === 0 && sectionIdx === 2;
                        const isOpenableBlock4 = activeTab === 0 && sectionIdx === 3;
                        const isOpenableLesson = isOpenableBlock1 || isOpenableBlock2 || isOpenableBlock3 || isOpenableBlock4;
                        const canOpen = isOpenableLesson && (effectiveStatus === 'current' || effectiveStatus === 'completed');
                        return (
                          <div
                            key={i}
                            role={canOpen ? 'button' : undefined}
                            tabIndex={canOpen ? 0 : undefined}
                            onClick={canOpen ? () => openLesson(sectionIdx, i, lesson.label, section.subsectionTitle) : undefined}
                            onKeyDown={canOpen ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLesson(sectionIdx, i, lesson.label, section.subsectionTitle); } } : undefined}
                            className={`flex-shrink-0 w-[200px] ${canOpen ? 'cursor-pointer' : ''}`}
                          >
                            <div
                              className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center bg-white overflow-hidden ${
                                effectiveStatus === 'completed'
                                  ? 'border-green-500'
                                  : effectiveStatus === 'current'
                                    ? 'border-blue-500'
                                    : 'border-gray-300 opacity-80'
                              }`}
                            >
                              {effectiveStatus === 'completed' && (
                                <span
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white z-10"
                                  aria-hidden
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                              {effectiveStatus === 'locked' && (
                                <span
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white z-10"
                                  aria-hidden
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </span>
                              )}
                              <div className="relative w-full flex-1 min-h-0 flex items-center justify-center p-2">
                                <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                                  <span className="text-4xl font-bold text-gray-500">{i + 1}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-2 text-center leading-tight font-medium">
                              {lesson.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Tez orada qo‘shiladi.</p>
                  )}
                </section>
              ))}
            </div>
            ) : (
            <div className="min-h-[200px] rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center py-12 px-4">
              <p className="text-4xl font-bold text-gray-300 mb-2">{activeTab + 1}</p>
              <p className="text-gray-500 text-sm">Bo‘lim {activeTab + 1}. Topshiriq keyinroq qo‘shiladi.</p>
              <p className="text-gray-400 text-xs mt-1">{MATH_SECTION_NAMES[activeTab]}</p>
            </div>
            );
          })()}

          {![0, 1, 4].includes(activeTab) && (
            <div className="min-h-[200px] rounded-xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center py-12 px-4">
              <p className="text-4xl font-bold text-gray-300 mb-2">
                {activeTab + 1}
              </p>
              <p className="text-gray-500 text-sm">
                Bo‘lim {activeTab + 1}. Topshiriq keyinroq qo‘shiladi.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {MATH_SECTION_NAMES[activeTab]}
              </p>
            </div>
          )}

          {/* Har bir topshiriq uchun boshlang‘ich oyna (maktabgacha matematikadagi kabi) */}
          {selectedLesson && (
            <div
              className="fixed inset-0 z-50 flex flex-col bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${getTaskImageBaseUrl(selectedLesson.tabIndex, selectedLesson.sectionIdx)}/${activeTab === 0 && selectedLesson.sectionIdx === 3 ? 'fon_blok4.png' : activeTab === 0 && (selectedLesson.sectionIdx === 1 || selectedLesson.sectionIdx === 2) ? 'fon4.png' : 'fon.png'})`,
              }}
            >
              {lessonScreen === 'start' && (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative p-4 sm:p-6 overflow-y-auto">
                  {activeTab === 0 && (selectedLesson.sectionIdx === 2 || selectedLesson.sectionIdx === 3) ? null : (
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="flex items-center gap-4 opacity-30 blur-md scale-90">
                      <CharacterAvatar name="Lola" size="lg" priority />
                      <Cube count={1} />
                      <span className="text-lg text-gray-500 max-w-[120px] text-center leading-tight">
                        {selectedLesson.lessonLabel}
                      </span>
                    </div>
                  </div>
                  )}
                  <button
                    type="button"
                    onClick={handleStartClick}
                    className="relative z-10 px-10 py-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex flex-row items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
                    aria-label="Boshlash"
                  >
                    <span className="text-4xl leading-none">▶</span>
                    <span className="text-2xl sm:text-3xl font-bold">Boshlash</span>
                  </button>
                </div>
              )}
              {lessonScreen === 'content' && (
                <TaskScreen
                  onBack={closeLesson}
                  imageBaseUrl={getTaskImageBaseUrl(selectedLesson.tabIndex, selectedLesson.sectionIdx)}
                  lessonVariant={
                    activeTab === 0 && selectedLesson.sectionIdx === 0 && selectedLesson.lessonIdx === 1
                      ? 'sayyorani'
                      : activeTab === 0 && selectedLesson.sectionIdx === 0 && selectedLesson.lessonIdx === 2
                        ? 'raketani-tuzat'
                        : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx === 0
                          ? 'tartib-bilan'
                          : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx === 1
                            ? 'ali-nechanchi-uy'
                            : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx === 2
                              ? 'raqam-yozish'
                              : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx >= 3
                                ? 'buyumlarni-next'
                                : activeTab === 0 && selectedLesson.sectionIdx === 2 && selectedLesson.lessonIdx === 0
                                  ? 'block3-task1'
                                  : activeTab === 0 && selectedLesson.sectionIdx === 2 && selectedLesson.lessonIdx === 1
                                    ? 'block3-task2'
                                    : activeTab === 0 && selectedLesson.sectionIdx === 3 && selectedLesson.lessonIdx === 0
                                      ? 'block4-task1'
                                      : 'boshlash'
                  }
                  block3Task1Stage={activeTab === 0 && selectedLesson.sectionIdx === 2 && selectedLesson.lessonIdx === 0 ? block3Task1Stage : undefined}
                  onBlock3Task1StageChange={activeTab === 0 && selectedLesson.sectionIdx === 2 && selectedLesson.lessonIdx === 0 ? setBlock3Task1Stage : undefined}
                  childId={childId ?? undefined}
                  courseId={courseId}
                  lessonSlug={getTaskImageBaseUrl(selectedLesson.tabIndex, selectedLesson.sectionIdx).split('/').pop() ?? 'lesson'}
                  onComplete={
                    activeTab === 0 && selectedLesson.sectionIdx === 0 && selectedLesson.lessonIdx === 0
                      ? () => {
                          const next = new Set(completedLessons).add('0-0');
                          setCompletedLessons(next);
                          setCompletedLessonsStorage(next);
                          reportLessonCompleteToApi(childId ?? null, courseId, '0-0');
                        }
                      : activeTab === 0 && selectedLesson.sectionIdx === 0 && selectedLesson.lessonIdx === 1
                        ? () => {
                            const next = new Set(completedLessons).add('0-1');
                            setCompletedLessons(next);
                            setCompletedLessonsStorage(next);
                            reportLessonCompleteToApi(childId ?? null, courseId, '0-1');
                            setSelectedLesson(null);
                          }
                        : activeTab === 0 && selectedLesson.sectionIdx === 0 && selectedLesson.lessonIdx === 2
                          ? () => {
                              const next = new Set(completedLessons).add('0-2');
                              setCompletedLessons(next);
                              setCompletedLessonsStorage(next);
                              reportLessonCompleteToApi(childId ?? null, courseId, '0-2');
                              setSelectedLesson(null);
                            }
                          : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx === 0
                            ? () => {
                                const next = new Set(completedLessons).add('1-0');
                                setCompletedLessons(next);
                                setCompletedLessonsStorage(next);
                                reportLessonCompleteToApi(childId ?? null, courseId, '1-0');
                                setSelectedLesson(null);
                              }
                            : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx === 1
                              ? () => {
                                  const next = new Set(completedLessons).add('1-1');
                                  setCompletedLessons(next);
                                  setCompletedLessonsStorage(next);
                                  reportLessonCompleteToApi(childId ?? null, courseId, '1-1');
                                  setSelectedLesson(null);
                                }
                              : activeTab === 0 && selectedLesson.sectionIdx === 1 && selectedLesson.lessonIdx === 2
                                ? () => {
                                    const next = new Set(completedLessons).add('1-2');
                                    setCompletedLessons(next);
                                    setCompletedLessonsStorage(next);
                                    reportLessonCompleteToApi(childId ?? null, courseId, '1-2');
                                    setSelectedLesson(null);
                                  }
                                : activeTab === 0 && selectedLesson.sectionIdx === 2 && selectedLesson.lessonIdx === 0
                                  ? () => {
                                      const next = new Set(completedLessons).add('2-0');
                                      setCompletedLessons(next);
                                      setCompletedLessonsStorage(next);
                                      reportLessonCompleteToApi(childId ?? null, courseId, '2-0');
                                      setSelectedLesson(null);
                                    }
                                    : activeTab === 0 && selectedLesson.sectionIdx === 2 && selectedLesson.lessonIdx === 1
                                    ? () => {
                                        const next = new Set(completedLessons).add('2-1');
                                        setCompletedLessons(next);
                                        setCompletedLessonsStorage(next);
                                        reportLessonCompleteToApi(childId ?? null, courseId, '2-1');
                                        setSelectedLesson(null);
                                      }
                                    : activeTab === 0 && selectedLesson.sectionIdx === 3 && selectedLesson.lessonIdx === 0
                                      ? () => {
                                          const next = new Set(completedLessons).add('3-0');
                                          setCompletedLessons(next);
                                          setCompletedLessonsStorage(next);
                                          reportLessonCompleteToApi(childId ?? null, courseId, '3-0');
                                          setSelectedLesson(null);
                                        }
                                      : undefined
                  }
                />
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
