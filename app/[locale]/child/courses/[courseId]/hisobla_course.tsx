'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from './hisobla/types';
import { GameEngine } from './hisobla/GameEngine';
import { getAdditionLevelTasks, getSubtractionLevelTasks, getMultiplicationLevelTasks, getDivisionLevelTasks, getMultyLevelTasks, ADDITION_LEVELS_COUNT, SUBTRACTION_LEVELS_COUNT, MULTIPLICATION_LEVELS_COUNT, DIVISION_LEVELS_COUNT, MULTY_LEVELS_COUNT } from './hisobla/LevelManager';
import { getAdditionProgress, saveAdditionProgress, getSubtractionProgress, saveSubtractionProgress, getMultiplicationProgress, saveMultiplicationProgress, getDivisionProgress, saveDivisionProgress, getMultyProgress, saveMultyProgress } from './hisobla/ProgressService';
import { LevelCompleteModal } from './hisobla/LevelCompleteModal';

type CourseItem = {
  id: string;
  title: string;
  titleUz?: string;
  price: string;
  purchased: boolean;
  progress: number;
};

const STORAGE_KEY = 'zukko_hisobla_records';
type OperationKey = 'qoshish' | 'ayirish' | 'kopaytirish' | 'bolish' | 'multy';

function getRecords(): Record<OperationKey, number> {
  if (typeof window === 'undefined') {
    return { qoshish: 0, ayirish: 0, kopaytirish: 0, bolish: 0, multy: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const obj = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return {
      qoshish: obj.qoshish ?? 0,
      ayirish: obj.ayirish ?? 0,
      kopaytirish: obj.kopaytirish ?? 0,
      bolish: obj.bolish ?? 0,
      multy: obj.multy ?? 0,
    };
  } catch {
    return { qoshish: 0, ayirish: 0, kopaytirish: 0, bolish: 0, multy: 0 };
  }
}

const OPERATIONS: { key: OperationKey; label: string; symbol: string; buttonClass: string }[] = [
  {
    key: 'qoshish',
    label: "Qo'shish",
    symbol: '+',
    buttonClass:
      'bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-800 border-2 border-emerald-600/80 shadow-lg shadow-emerald-900/25',
  },
  {
    key: 'ayirish',
    label: 'Ayirish',
    symbol: '−',
    buttonClass:
      'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 hover:from-amber-500 hover:via-amber-600 hover:to-amber-800 border-2 border-amber-600/80 shadow-lg shadow-amber-900/25',
  },
  {
    key: 'kopaytirish',
    label: "Ko'paytirish",
    symbol: '×',
    buttonClass:
      'bg-gradient-to-b from-sky-400 via-sky-500 to-sky-700 hover:from-sky-500 hover:via-sky-600 hover:to-sky-800 border-2 border-sky-600/80 shadow-lg shadow-sky-900/25',
  },
  {
    key: 'bolish',
    label: "Bo'lish",
    symbol: '÷',
    buttonClass:
      'bg-gradient-to-b from-violet-400 via-violet-500 to-violet-700 hover:from-violet-500 hover:via-violet-600 hover:to-violet-800 border-2 border-violet-600/80 shadow-lg shadow-violet-900/25',
  },
  {
    key: 'multy',
    label: 'Multy',
    symbol: '★',
    buttonClass:
      'bg-gradient-to-b from-rose-400 via-rose-500 to-rose-700 hover:from-rose-500 hover:via-rose-600 hover:to-rose-800 border-2 border-rose-600/80 shadow-lg shadow-rose-900/25',
  },
];

const SOUND_PREF_KEY = 'zukko_hisobla_sound';

function getSoundPref(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = localStorage.getItem(SOUND_PREF_KEY);
    return v !== 'false';
  } catch {
    return true;
  }
}

const GAME_RULES =
  "Berilgan savollarga to'g'ri javob bering. Vaqt cheklangan — tezroq javob bering, ko'proq ball to'plang. Rekordingizni yangilang!";

function LevelSelectScreen({
  unlockedLevel,
  onSelectLevel,
  onClose,
  title = "Qo'shish",
  levelsCount = ADDITION_LEVELS_COUNT,
}: {
  unlockedLevel: number;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
  title?: string;
  levelsCount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-300 via-sky-200 to-blue-100"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-10 flex items-center justify-center gap-2 px-1 py-2 text-gray-700 hover:text-gray-900"
        aria-label="Orqaga"
      >
        <span className="text-xl leading-none">←</span>
        <span className="font-semibold">Orqaga</span>
      </button>
      <h2 className="text-2xl font-bold text-gray-800 mb-2 mt-12">{title}</h2>
      <p className="text-gray-600 mb-6">Darajani tanlang</p>
      <div className="grid grid-cols-5 gap-3 max-w-xs">
        {Array.from({ length: levelsCount }, (_, i) => i + 1).map((level) => {
          const unlocked = level <= unlockedLevel;
          return (
            <button
              key={level}
              type="button"
              onClick={() => unlocked && onSelectLevel(level)}
              disabled={!unlocked}
              className={`w-14 h-14 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95 ${
                unlocked
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-700'
                  : 'bg-gray-300 text-gray-500 border-2 border-gray-400 cursor-not-allowed'
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

const IMAGE_OFFSET_MIN = -280;
const IMAGE_OFFSET_MAX = 280;
const HERO_SPEED_PX_S = 264;
const HERO_ACCEL = 5.5;
const HERO_TILT_UP_MAX = 6;
const HERO_TILT_DOWN_MAX = 10;
const HERO_TILT_SCALE_UP = 0.028;
const HERO_TILT_SCALE_DOWN = HERO_TILT_DOWN_MAX / HERO_SPEED_PX_S;
const TRAIL_SPAWN_INTERVAL_MS = 150;
const TRAIL_MAX_COUNT = 12;
const TRAIL_VELOCITY_THRESHOLD = 8;
type TrailItem = { id: number; x: number; y: number };

function GameScreen({
  showRulesCard,
  operationLabel,
  operationSymbol,
  operationKey,
  score,
  onScoreChange,
  soundOn,
  onSoundToggle,
  onStart,
  onClose,
  gameRestartKey,
  onRestart,
  fixedTasks,
  onGameComplete,
  onNextLevel,
  currentLevel,
}: {
  showRulesCard: boolean;
  operationLabel: string;
  operationSymbol: string;
  operationKey: OperationKey;
  score: number;
  onScoreChange: (score: number) => void;
  soundOn: boolean;
  onSoundToggle: () => void;
  onStart: () => void;
  onClose: () => void;
  gameRestartKey: number;
  onRestart: () => void;
  fixedTasks?: Task[] | null;
  onGameComplete?: (finalScore: number) => void;
  onNextLevel?: () => void;
  currentLevel?: number | null;
}) {
  const [imageOffsetY, setImageOffsetY] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [trails, setTrails] = useState<TrailItem[]>([]);
  const imageOffsetYRef = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartOffset = useRef(0);
  const upPressed = useRef(false);
  const downPressed = useRef(false);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const lastTrailSpawnRef = useRef(0);
  const rafIdRef = useRef<number>(0);
  const trailsCountRef = useRef(0);
  trailsCountRef.current = trails.length;

  const [isPortrait, setIsPortrait] = useState(false);
  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    check();
    // Повторная проверка после загрузки (на мобильных размеры иногда приходят с задержкой)
    const t = setTimeout(check, 150);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    imageOffsetYRef.current = imageOffsetY;
  }, [imageOffsetY]);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const targetVel = upPressed.current
        ? -HERO_SPEED_PX_S
        : downPressed.current
          ? HERO_SPEED_PX_S
          : 0;
      let v = velocityRef.current;
      v += (targetVel - v) * (dt * HERO_ACCEL);
      if (Math.abs(v) < 0.5) v = 0;
      velocityRef.current = v;

      let pos = imageOffsetYRef.current + v * dt;
      pos = Math.max(IMAGE_OFFSET_MIN, Math.min(IMAGE_OFFSET_MAX, pos));
      imageOffsetYRef.current = pos;
      setImageOffsetY(pos);

      const tiltDeg =
        v >= 0
          ? Math.min(HERO_TILT_DOWN_MAX, v * HERO_TILT_SCALE_DOWN)
          : Math.max(-HERO_TILT_UP_MAX, v * HERO_TILT_SCALE_UP);
      setTilt(tiltDeg);

      if (
        Math.abs(v) > TRAIL_VELOCITY_THRESHOLD &&
        now - lastTrailSpawnRef.current >= TRAIL_SPAWN_INTERVAL_MS &&
        trailsCountRef.current < TRAIL_MAX_COUNT &&
        heroRef.current
      ) {
        lastTrailSpawnRef.current = now;
        const rect = heroRef.current.getBoundingClientRect();
        const x = rect.left + rect.width * 0.18;
        const y = rect.bottom - rect.height * 0.22;
        const id = now;
        setTrails((prev) => {
          const next = prev.length >= TRAIL_MAX_COUNT ? prev.slice(1) : prev;
          return [...next, { id, x, y }];
        });
        setTimeout(() => {
          setTrails((prev) => prev.filter((t) => t.id !== id));
        }, 800);
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        upPressed.current = true;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        downPressed.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') upPressed.current = false;
      if (e.key === 'ArrowDown') downPressed.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartOffset.current = imageOffsetYRef.current;
    setTilt(0);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    const next = Math.max(
      IMAGE_OFFSET_MIN,
      Math.min(IMAGE_OFFSET_MAX, touchStartOffset.current + deltaY)
    );
    setImageOffsetY(next);
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = null;
    setIsDragging(false);
  }, []);

  // Показываем просьбу повернуть экран при портретной ориентации (всегда, не только после "Boshlash")
  if (isPortrait) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-400 to-blue-200"
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center max-w-sm">
          <div className="w-24 h-24 rounded-2xl bg-white/90 flex items-center justify-center shadow-lg border-2 border-sky-200">
            <svg className="w-14 h-14 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            Ekranni aylantiring
          </p>
          <p className="text-base text-gray-600">
            O&apos;yin faqat yotiq ekranda ishlaydi
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-10 flex items-center justify-center gap-2 px-1 py-2 text-gray-700 hover:text-gray-900"
          aria-label="Orqaga"
        >
          <span className="text-xl leading-none">←</span>
          <span className="font-semibold">Orqaga</span>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-300 via-sky-200 to-blue-100"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-10 flex items-center justify-center gap-2 px-1 py-2 text-gray-700 hover:text-gray-900"
        aria-label="Orqaga"
      >
        <span className="text-xl leading-none">←</span>
        <span className="font-semibold">Orqaga</span>
      </button>

      <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl bg-white/90 border border-gray-200 shadow font-bold text-gray-800 flex flex-col gap-1 items-end">
        {currentLevel != null && (
          <span className="text-gray-600 text-sm sm:text-base">Daraja: <span className="text-sky-600 tabular-nums">{currentLevel}</span></span>
        )}
        <span>Ball: <span className="text-sky-600 tabular-nums">{score}</span></span>
      </div>

      <div
        ref={heroRef}
        className="absolute left-4 top-1/2 z-[8] w-[144px] h-[144px] sm:w-[336px] sm:h-[336px] md:w-[384px] md:h-[384px] touch-none select-none box-border"
        style={{
          transform: `translateY(calc(-50% + ${imageOffsetY}px)) rotate(${tilt}deg)`,
          transition: isDragging ? 'none' : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="img"
        aria-label="Ali uch"
      >
        <Image
          src="/courses/hisobla/ali_uch.png"
          alt="Ali uch"
          fill
          className="object-contain drop-shadow-lg pointer-events-none"
          sizes="(max-width: 640px) 144px, (max-width: 768px) 336px, 384px"
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-[4]" aria-hidden>
        {trails.map((t) => (
          <div
            key={t.id}
            className="hero-trail absolute w-[26px] h-[26px] rounded-full pointer-events-none"
            style={{
              left: t.x,
              top: t.y,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,215,0,0.95) 0%, rgba(255,193,37,0.5) 40%, rgba(255,180,0,0.15) 70%, transparent 100%)',
              filter: 'blur(3px)',
              boxShadow: '0 0 10px rgba(255,215,0,0.5)',
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {showRulesCard && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border-2 border-white/80 mx-4"
          >
            <div className="text-4xl sm:text-5xl mb-4 text-sky-600">{operationSymbol}</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{operationLabel}</h2>
            <p className="font-hisobla text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
              {GAME_RULES}
            </p>
            <button
              type="button"
              onClick={onStart}
              className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg transition-colors"
            >
              Boshlash
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!showRulesCard && (
        <GameEngine
          key={gameRestartKey}
          mode={operationKey}
          heroRef={heroRef}
          score={score}
          onScoreChange={onScoreChange}
          soundOn={soundOn}
          onGameComplete={onGameComplete ?? (() => {})}
          onClose={onClose}
          onRestart={onRestart}
          onNextLevel={onNextLevel}
          fixedTasks={fixedTasks}
        />
      )}

      <button
        type="button"
        onClick={onSoundToggle}
        className="absolute bottom-6 right-6 z-10 w-14 h-14 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white border-2 border-gray-200 shadow-lg"
        aria-label={soundOn ? 'Ovozni o\'chirish' : 'Ovozni yoqish'}
        title={soundOn ? "Ovozni o'chirish" : "Ovozni yoqish"}
      >
        {soundOn ? (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        )}
      </button>
    </motion.div>
  );
}

export default function HisoblaCoursePage({
  course,
  locale,
  linkSuffix,
}: {
  course: CourseItem;
  locale: string;
  linkSuffix: string;
}) {
  const prefix = `/${locale}`;
  const backUrl = `${prefix}/child${linkSuffix}`;
  const [records, setRecords] = useState<Record<OperationKey, number>>(getRecords);
  const [selectedOp, setSelectedOp] = useState<OperationKey | null>(null);
  const [showRulesCard, setShowRulesCard] = useState(true);
  const [gameScore, setGameScore] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [gameRestartKey, setGameRestartKey] = useState(0);
  const [additionSelectedLevel, setAdditionSelectedLevel] = useState<number | null>(null);
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);
  const [levelCompleteLevel, setLevelCompleteLevel] = useState(1);
  const [levelCompleteScore, setLevelCompleteScore] = useState(0);
  const [additionGameRestartKey, setAdditionGameRestartKey] = useState(0);

  const [subtractionSelectedLevel, setSubtractionSelectedLevel] = useState<number | null>(null);
  const [showSubtractionLevelCompleteModal, setShowSubtractionLevelCompleteModal] = useState(false);
  const [subtractionLevelCompleteLevel, setSubtractionLevelCompleteLevel] = useState(1);
  const [subtractionLevelCompleteScore, setSubtractionLevelCompleteScore] = useState(0);
  const [subtractionGameRestartKey, setSubtractionGameRestartKey] = useState(0);

  const [multiplicationSelectedLevel, setMultiplicationSelectedLevel] = useState<number | null>(null);
  const [showMultiplicationLevelCompleteModal, setShowMultiplicationLevelCompleteModal] = useState(false);
  const [multiplicationLevelCompleteLevel, setMultiplicationLevelCompleteLevel] = useState(1);
  const [multiplicationLevelCompleteScore, setMultiplicationLevelCompleteScore] = useState(0);
  const [multiplicationGameRestartKey, setMultiplicationGameRestartKey] = useState(0);

  const [divisionSelectedLevel, setDivisionSelectedLevel] = useState<number | null>(null);
  const [showDivisionLevelCompleteModal, setShowDivisionLevelCompleteModal] = useState(false);
  const [divisionLevelCompleteLevel, setDivisionLevelCompleteLevel] = useState(1);
  const [divisionLevelCompleteScore, setDivisionLevelCompleteScore] = useState(0);
  const [divisionGameRestartKey, setDivisionGameRestartKey] = useState(0);

  const [multySelectedLevel, setMultySelectedLevel] = useState<number | null>(null);
  const [showMultyLevelCompleteModal, setShowMultyLevelCompleteModal] = useState(false);
  const [multyLevelCompleteLevel, setMultyLevelCompleteLevel] = useState(1);
  const [multyLevelCompleteScore, setMultyLevelCompleteScore] = useState(0);
  const [multyGameRestartKey, setMultyGameRestartKey] = useState(0);

  const additionProgress = getAdditionProgress();
  const additionFixedTasks = useMemo(
    () => (additionSelectedLevel !== null ? getAdditionLevelTasks(additionSelectedLevel) : []),
    [additionSelectedLevel]
  );

  const subtractionProgress = getSubtractionProgress();
  const subtractionFixedTasks = useMemo(
    () => (subtractionSelectedLevel !== null ? getSubtractionLevelTasks(subtractionSelectedLevel) : []),
    [subtractionSelectedLevel]
  );

  const multiplicationProgress = getMultiplicationProgress();
  const multiplicationFixedTasks = useMemo(
    () => (multiplicationSelectedLevel !== null ? getMultiplicationLevelTasks(multiplicationSelectedLevel) : []),
    [multiplicationSelectedLevel]
  );

  const divisionProgress = getDivisionProgress();
  const divisionFixedTasks = useMemo(
    () => (divisionSelectedLevel !== null ? getDivisionLevelTasks(divisionSelectedLevel) : []),
    [divisionSelectedLevel]
  );

  const multyProgress = getMultyProgress();
  const multyFixedTasks = useMemo(
    () => (multySelectedLevel !== null ? getMultyLevelTasks(multySelectedLevel) : []),
    [multySelectedLevel]
  );

  const refreshRecords = useCallback(() => setRecords(getRecords()), []);

  useEffect(() => {
    refreshRecords();
    window.addEventListener('focus', refreshRecords);
    return () => window.removeEventListener('focus', refreshRecords);
  }, [refreshRecords]);

  useEffect(() => {
    setSoundOn(getSoundPref());
  }, []);

  const openGame = useCallback((op: OperationKey) => {
    setSelectedOp(op);
    setShowRulesCard(true);
    setGameScore(0);
    if (op === 'qoshish') setAdditionSelectedLevel(null);
    if (op === 'ayirish') setSubtractionSelectedLevel(null);
    if (op === 'kopaytirish') setMultiplicationSelectedLevel(null);
    if (op === 'bolish') setDivisionSelectedLevel(null);
    if (op === 'multy') setMultySelectedLevel(null);
  }, []);

  const handleStart = useCallback(() => {
    setShowRulesCard(false);
    // TODO: start actual game for selectedOp, call setGameScore when points change
  }, []);

  const handleSoundToggle = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_PREF_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const selectedOperation = selectedOp ? OPERATIONS.find((o) => o.key === selectedOp) : null;

  return (
    <>
      <AnimatePresence>
        {selectedOperation && selectedOperation.key === 'qoshish' && additionSelectedLevel === null && (
          <LevelSelectScreen
            unlockedLevel={additionProgress.unlockedLevel}
            onSelectLevel={(level) => {
              setAdditionSelectedLevel(level);
              setGameScore(0);
            }}
            onClose={() => setSelectedOp(null)}
          />
        )}
        {selectedOperation && selectedOperation.key === 'ayirish' && subtractionSelectedLevel === null && (
          <LevelSelectScreen
            title="Ayirish"
            levelsCount={SUBTRACTION_LEVELS_COUNT}
            unlockedLevel={subtractionProgress.unlockedLevel}
            onSelectLevel={(level) => {
              setSubtractionSelectedLevel(level);
              setGameScore(0);
            }}
            onClose={() => setSelectedOp(null)}
          />
        )}
        {selectedOperation && selectedOperation.key === 'kopaytirish' && multiplicationSelectedLevel === null && (
          <LevelSelectScreen
            title="Ko'paytirish"
            levelsCount={MULTIPLICATION_LEVELS_COUNT}
            unlockedLevel={multiplicationProgress.unlockedLevel}
            onSelectLevel={(level) => {
              setMultiplicationSelectedLevel(level);
              setGameScore(0);
            }}
            onClose={() => setSelectedOp(null)}
          />
        )}
        {selectedOperation && selectedOperation.key === 'bolish' && divisionSelectedLevel === null && (
          <LevelSelectScreen
            title="Bo'lish"
            levelsCount={DIVISION_LEVELS_COUNT}
            unlockedLevel={divisionProgress.unlockedLevel}
            onSelectLevel={(level) => {
              setDivisionSelectedLevel(level);
              setGameScore(0);
            }}
            onClose={() => setSelectedOp(null)}
          />
        )}
        {selectedOperation && selectedOperation.key === 'multy' && multySelectedLevel === null && (
          <LevelSelectScreen
            title="Multy"
            levelsCount={MULTY_LEVELS_COUNT}
            unlockedLevel={multyProgress.unlockedLevel}
            onSelectLevel={(level) => {
              setMultySelectedLevel(level);
              setGameScore(0);
            }}
            onClose={() => setSelectedOp(null)}
          />
        )}
        {selectedOperation && (selectedOperation.key !== 'qoshish' || additionSelectedLevel !== null) && (selectedOperation.key !== 'ayirish' || subtractionSelectedLevel !== null) && (selectedOperation.key !== 'kopaytirish' || multiplicationSelectedLevel !== null) && (selectedOperation.key !== 'bolish' || divisionSelectedLevel !== null) && (selectedOperation.key !== 'multy' || multySelectedLevel !== null) && (
          selectedOperation.key === 'qoshish' && additionSelectedLevel !== null ? (
            <>
              <GameScreen
                showRulesCard={false}
                operationLabel={selectedOperation.label}
                operationSymbol={selectedOperation.symbol}
                operationKey={selectedOperation.key}
                score={gameScore}
                onScoreChange={setGameScore}
                soundOn={soundOn}
                onSoundToggle={handleSoundToggle}
                onStart={() => {}}
                onClose={() => {
                  setSelectedOp(null);
                  setAdditionSelectedLevel(null);
                }}
                gameRestartKey={additionGameRestartKey}
                onRestart={() => setAdditionGameRestartKey((k) => k + 1)}
                fixedTasks={additionFixedTasks}
                onGameComplete={(score) => {
                  saveAdditionProgress({
                    unlockedLevel: Math.max(additionProgress.unlockedLevel, additionSelectedLevel + 1),
                    lastPlayedLevel: additionSelectedLevel,
                    score,
                  });
                  setLevelCompleteLevel(additionSelectedLevel);
                  setLevelCompleteScore(score);
                  setShowLevelCompleteModal(true);
                }}
                onNextLevel={() => {
                  setShowLevelCompleteModal(false);
                  if (levelCompleteLevel < ADDITION_LEVELS_COUNT) {
                    setAdditionSelectedLevel(levelCompleteLevel + 1);
                    setGameScore(0);
                    setAdditionGameRestartKey((k) => k + 1);
                  } else {
                    setAdditionSelectedLevel(null);
                  }
                }}
                currentLevel={additionSelectedLevel}
              />
              <LevelCompleteModal
                visible={showLevelCompleteModal}
                level={levelCompleteLevel}
                score={levelCompleteScore}
                onNext={() => {
                  setShowLevelCompleteModal(false);
                  if (levelCompleteLevel < ADDITION_LEVELS_COUNT) {
                    setAdditionSelectedLevel(levelCompleteLevel + 1);
                    setGameScore(0);
                    setAdditionGameRestartKey((k) => k + 1);
                  } else {
                    setAdditionSelectedLevel(null);
                  }
                }}
                onRestart={() => {
                  setShowLevelCompleteModal(false);
                  setGameScore(0);
                  setAdditionGameRestartKey((k) => k + 1);
                }}
                onBack={() => {
                  setShowLevelCompleteModal(false);
                  setAdditionSelectedLevel(null);
                }}
              />
            </>
          ) : selectedOperation.key === 'ayirish' && subtractionSelectedLevel !== null ? (
            <>
              <GameScreen
                showRulesCard={false}
                operationLabel={selectedOperation.label}
                operationSymbol={selectedOperation.symbol}
                operationKey={selectedOperation.key}
                score={gameScore}
                onScoreChange={setGameScore}
                soundOn={soundOn}
                onSoundToggle={handleSoundToggle}
                onStart={() => {}}
                onClose={() => {
                  setSelectedOp(null);
                  setSubtractionSelectedLevel(null);
                }}
                gameRestartKey={subtractionGameRestartKey}
                onRestart={() => setSubtractionGameRestartKey((k) => k + 1)}
                fixedTasks={subtractionFixedTasks}
                onGameComplete={(score) => {
                  saveSubtractionProgress({
                    unlockedLevel: Math.max(subtractionProgress.unlockedLevel, subtractionSelectedLevel + 1),
                    lastPlayedLevel: subtractionSelectedLevel,
                    score,
                  });
                  setSubtractionLevelCompleteLevel(subtractionSelectedLevel);
                  setSubtractionLevelCompleteScore(score);
                  setShowSubtractionLevelCompleteModal(true);
                }}
                onNextLevel={() => {
                  setShowSubtractionLevelCompleteModal(false);
                  if (subtractionLevelCompleteLevel < SUBTRACTION_LEVELS_COUNT) {
                    setSubtractionSelectedLevel(subtractionLevelCompleteLevel + 1);
                    setGameScore(0);
                    setSubtractionGameRestartKey((k) => k + 1);
                  } else {
                    setSubtractionSelectedLevel(null);
                  }
                }}
                currentLevel={subtractionSelectedLevel}
              />
              <LevelCompleteModal
                visible={showSubtractionLevelCompleteModal}
                level={subtractionLevelCompleteLevel}
                score={subtractionLevelCompleteScore}
                onNext={() => {
                  setShowSubtractionLevelCompleteModal(false);
                  if (subtractionLevelCompleteLevel < SUBTRACTION_LEVELS_COUNT) {
                    setSubtractionSelectedLevel(subtractionLevelCompleteLevel + 1);
                    setGameScore(0);
                    setSubtractionGameRestartKey((k) => k + 1);
                  } else {
                    setSubtractionSelectedLevel(null);
                  }
                }}
                onRestart={() => {
                  setShowSubtractionLevelCompleteModal(false);
                  setGameScore(0);
                  setSubtractionGameRestartKey((k) => k + 1);
                }}
                onBack={() => {
                  setShowSubtractionLevelCompleteModal(false);
                  setSubtractionSelectedLevel(null);
                }}
              />
            </>
          ) : selectedOperation.key === 'kopaytirish' && multiplicationSelectedLevel !== null ? (
            <>
              <GameScreen
                showRulesCard={false}
                operationLabel={selectedOperation.label}
                operationSymbol={selectedOperation.symbol}
                operationKey={selectedOperation.key}
                score={gameScore}
                onScoreChange={setGameScore}
                soundOn={soundOn}
                onSoundToggle={handleSoundToggle}
                onStart={() => {}}
                onClose={() => {
                  setSelectedOp(null);
                  setMultiplicationSelectedLevel(null);
                }}
                gameRestartKey={multiplicationGameRestartKey}
                onRestart={() => setMultiplicationGameRestartKey((k) => k + 1)}
                fixedTasks={multiplicationFixedTasks}
                onGameComplete={(score) => {
                  saveMultiplicationProgress({
                    unlockedLevel: Math.max(multiplicationProgress.unlockedLevel, multiplicationSelectedLevel + 1),
                    lastPlayedLevel: multiplicationSelectedLevel,
                    score,
                  });
                  setMultiplicationLevelCompleteLevel(multiplicationSelectedLevel);
                  setMultiplicationLevelCompleteScore(score);
                  setShowMultiplicationLevelCompleteModal(true);
                }}
                onNextLevel={() => {
                  setShowMultiplicationLevelCompleteModal(false);
                  if (multiplicationLevelCompleteLevel < MULTIPLICATION_LEVELS_COUNT) {
                    setMultiplicationSelectedLevel(multiplicationLevelCompleteLevel + 1);
                    setGameScore(0);
                    setMultiplicationGameRestartKey((k) => k + 1);
                  } else {
                    setMultiplicationSelectedLevel(null);
                  }
                }}
                currentLevel={multiplicationSelectedLevel}
              />
              <LevelCompleteModal
                visible={showMultiplicationLevelCompleteModal}
                level={multiplicationLevelCompleteLevel}
                score={multiplicationLevelCompleteScore}
                onNext={() => {
                  setShowMultiplicationLevelCompleteModal(false);
                  if (multiplicationLevelCompleteLevel < MULTIPLICATION_LEVELS_COUNT) {
                    setMultiplicationSelectedLevel(multiplicationLevelCompleteLevel + 1);
                    setGameScore(0);
                    setMultiplicationGameRestartKey((k) => k + 1);
                  } else {
                    setMultiplicationSelectedLevel(null);
                  }
                }}
                onRestart={() => {
                  setShowMultiplicationLevelCompleteModal(false);
                  setGameScore(0);
                  setMultiplicationGameRestartKey((k) => k + 1);
                }}
                onBack={() => {
                  setShowMultiplicationLevelCompleteModal(false);
                  setMultiplicationSelectedLevel(null);
                }}
              />
            </>
          ) : selectedOperation.key === 'bolish' && divisionSelectedLevel !== null ? (
            <>
              <GameScreen
                showRulesCard={false}
                operationLabel={selectedOperation.label}
                operationSymbol={selectedOperation.symbol}
                operationKey={selectedOperation.key}
                score={gameScore}
                onScoreChange={setGameScore}
                soundOn={soundOn}
                onSoundToggle={handleSoundToggle}
                onStart={() => {}}
                onClose={() => {
                  setSelectedOp(null);
                  setDivisionSelectedLevel(null);
                }}
                gameRestartKey={divisionGameRestartKey}
                onRestart={() => setDivisionGameRestartKey((k) => k + 1)}
                fixedTasks={divisionFixedTasks}
                onGameComplete={(score) => {
                  saveDivisionProgress({
                    unlockedLevel: Math.max(divisionProgress.unlockedLevel, divisionSelectedLevel + 1),
                    lastPlayedLevel: divisionSelectedLevel,
                    score,
                  });
                  setDivisionLevelCompleteLevel(divisionSelectedLevel);
                  setDivisionLevelCompleteScore(score);
                  setShowDivisionLevelCompleteModal(true);
                }}
                onNextLevel={() => {
                  setShowDivisionLevelCompleteModal(false);
                  if (divisionLevelCompleteLevel < DIVISION_LEVELS_COUNT) {
                    setDivisionSelectedLevel(divisionLevelCompleteLevel + 1);
                    setGameScore(0);
                    setDivisionGameRestartKey((k) => k + 1);
                  } else {
                    setDivisionSelectedLevel(null);
                  }
                }}
                currentLevel={divisionSelectedLevel}
              />
              <LevelCompleteModal
                visible={showDivisionLevelCompleteModal}
                level={divisionLevelCompleteLevel}
                score={divisionLevelCompleteScore}
                onNext={() => {
                  setShowDivisionLevelCompleteModal(false);
                  if (divisionLevelCompleteLevel < DIVISION_LEVELS_COUNT) {
                    setDivisionSelectedLevel(divisionLevelCompleteLevel + 1);
                    setGameScore(0);
                    setDivisionGameRestartKey((k) => k + 1);
                  } else {
                    setDivisionSelectedLevel(null);
                  }
                }}
                onRestart={() => {
                  setShowDivisionLevelCompleteModal(false);
                  setGameScore(0);
                  setDivisionGameRestartKey((k) => k + 1);
                }}
                onBack={() => {
                  setShowDivisionLevelCompleteModal(false);
                  setDivisionSelectedLevel(null);
                }}
              />
            </>
          ) : selectedOperation.key === 'multy' && multySelectedLevel !== null ? (
            <>
              <GameScreen
                showRulesCard={false}
                operationLabel={selectedOperation.label}
                operationSymbol={selectedOperation.symbol}
                operationKey={selectedOperation.key}
                score={gameScore}
                onScoreChange={setGameScore}
                soundOn={soundOn}
                onSoundToggle={handleSoundToggle}
                onStart={() => {}}
                onClose={() => {
                  setSelectedOp(null);
                  setMultySelectedLevel(null);
                }}
                gameRestartKey={multyGameRestartKey}
                onRestart={() => setMultyGameRestartKey((k) => k + 1)}
                fixedTasks={multyFixedTasks}
                onGameComplete={(score) => {
                  saveMultyProgress({
                    unlockedLevel: Math.max(multyProgress.unlockedLevel, multySelectedLevel + 1),
                    lastPlayedLevel: multySelectedLevel,
                    score,
                  });
                  setMultyLevelCompleteLevel(multySelectedLevel);
                  setMultyLevelCompleteScore(score);
                  setShowMultyLevelCompleteModal(true);
                }}
                onNextLevel={() => {
                  setShowMultyLevelCompleteModal(false);
                  if (multyLevelCompleteLevel < MULTY_LEVELS_COUNT) {
                    setMultySelectedLevel(multyLevelCompleteLevel + 1);
                    setGameScore(0);
                    setMultyGameRestartKey((k) => k + 1);
                  } else {
                    setMultySelectedLevel(null);
                  }
                }}
                currentLevel={multySelectedLevel}
              />
              <LevelCompleteModal
                visible={showMultyLevelCompleteModal}
                level={multyLevelCompleteLevel}
                score={multyLevelCompleteScore}
                onNext={() => {
                  setShowMultyLevelCompleteModal(false);
                  if (multyLevelCompleteLevel < MULTY_LEVELS_COUNT) {
                    setMultySelectedLevel(multyLevelCompleteLevel + 1);
                    setGameScore(0);
                    setMultyGameRestartKey((k) => k + 1);
                  } else {
                    setMultySelectedLevel(null);
                  }
                }}
                onRestart={() => {
                  setShowMultyLevelCompleteModal(false);
                  setGameScore(0);
                  setMultyGameRestartKey((k) => k + 1);
                }}
                onBack={() => {
                  setShowMultyLevelCompleteModal(false);
                  setMultySelectedLevel(null);
                }}
              />
            </>
          ) : (
            <GameScreen
              showRulesCard={showRulesCard}
              operationLabel={selectedOperation.label}
              operationSymbol={selectedOperation.symbol}
              operationKey={selectedOperation.key}
              score={gameScore}
              onScoreChange={setGameScore}
              soundOn={soundOn}
              onSoundToggle={handleSoundToggle}
              onStart={handleStart}
              onClose={() => setSelectedOp(null)}
              gameRestartKey={gameRestartKey}
              onRestart={() => {
                setGameScore(0);
                setGameRestartKey((k) => k + 1);
              }}
            />
          )
        )}
      </AnimatePresence>

    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/courses/hisobla/fon_main.png)' }}
    >
      <header className="flex items-center gap-3 p-4">
        <Link
          href={backUrl}
          className="flex items-center justify-center gap-2 px-1 py-2 text-gray-700 hover:text-gray-900 shrink-0"
          aria-label="Orqaga"
        >
          <span className="text-xl leading-none">←</span>
          <span className="font-semibold">Orqaga</span>
        </Link>
        <h1 className="text-lg font-bold text-gray-800 truncate">
          {course.titleUz ?? course.title}
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
        <p className="font-hisobla text-center text-xl sm:text-2xl text-gray-800 leading-relaxed mb-10 font-semibold px-2">
          Qiziqarli &quot;Hisobla va uch&quot; matematik o&apos;yinida kuchingizni sinab ko&apos;ring.
        </p>

        <div className="w-full max-w-xs mx-auto grid grid-cols-1 gap-4">
          {OPERATIONS.map((op) => {
            const record = records[op.key];
            return (
              <button
                key={op.key}
                type="button"
                onClick={() => openGame(op.key)}
                className={`relative w-full py-7 px-6 rounded-2xl text-white font-bold text-lg sm:text-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] ${op.buttonClass}`}
              >
                <span className="absolute top-2 right-3 text-xs font-semibold text-white/90 bg-black/20 rounded-lg px-2 py-1">
                  Rekord: {record > 0 ? record : '—'}
                </span>
                <span className="text-2xl sm:text-3xl opacity-90">{op.symbol}</span>
                <span>{op.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
    </>
  );
}
