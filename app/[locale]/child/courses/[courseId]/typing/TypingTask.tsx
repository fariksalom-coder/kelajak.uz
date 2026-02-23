'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CELL_WIDTH = 3; // rem

/** Звук нажатия клавиши (файл в public/audio/) */
const KEY_PRESS_SOUND = '/audio/key.mp3';

function playKeySound(): void {
  try {
    const audio = new Audio(KEY_PRESS_SOUND);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

type CellStatus = 'default' | 'active' | 'correct' | 'wrong';

type CellProps = {
  char: string;
  status: CellStatus;
  widthRem: number;
};

function Cell({ char, status, widthRem }: CellProps) {
  return (
    <div
      className={`
        flex-shrink-0 flex items-center justify-center text-xl font-mono font-semibold
        border border-gray-200 rounded
        transition-colors duration-150
        ${status === 'default' ? 'bg-white text-gray-700' : ''}
        ${status === 'active' ? 'bg-sky-100 text-sky-900 border-sky-400 ring-2 ring-sky-300 ring-offset-1' : ''}
        ${status === 'correct' ? 'bg-green-100 text-green-900 border-green-400' : ''}
        ${status === 'wrong' ? 'bg-red-100 text-red-900 border-red-400' : ''}
      `}
      style={{ width: `${widthRem}rem`, minWidth: `${widthRem}rem`, height: '3.25rem' }}
    >
      {char === ' ' ? '␣' : char}
    </div>
  );
}

type TaskRowProps = {
  chars: string[];
  currentIndex: number;
  wrongIndex: number | null;
  cellWidthRem: number;
};

function TaskRow({ chars, currentIndex, wrongIndex, cellWidthRem }: TaskRowProps) {
  const getStatus = useCallback(
    (index: number): CellStatus => {
      if (wrongIndex !== null && index === wrongIndex) return 'wrong';
      if (index < currentIndex) return 'correct';
      if (index === currentIndex) return 'active';
      return 'default';
    },
    [currentIndex, wrongIndex]
  );

  const offsetRem = -currentIndex * cellWidthRem;

  return (
    <div
      className="flex flex-shrink-0 transition-transform duration-200 ease-out"
      style={{
        transform: `translateX(${offsetRem}rem)`,
        willChange: 'transform',
      }}
    >
      {chars.map((char, i) => (
        <Cell
          key={`${i}-${char}`}
          char={char}
          status={getStatus(i)}
          widthRem={cellWidthRem}
        />
      ))}
    </div>
  );
}

// ——— StatsBar ———

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type StatsBarProps = {
  correct: number;
  errors: number;
  timeSeconds: number;
  className?: string;
};

export function StatsBar({ correct, errors, timeSeconds, className = '' }: StatsBarProps) {
  return (
    <div
      className={`flex flex-row items-center justify-center gap-12 sm:gap-16 py-3 px-4 bg-gray-100 border-b border-gray-200 rounded-t-lg ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums text-green-700">
          {correct}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Correct</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums text-red-600">
          {errors}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Errors</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-2xl sm:text-3xl font-bold tabular-nums text-gray-800">
          {formatTime(timeSeconds)}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Time</span>
      </div>
    </div>
  );
}

// ——— Layout: StatsBar + TypingTask block with 5cm offset ———

export type TypingTaskStats = {
  correct: number;
  errors: number;
  timeSeconds: number;
};

export type TypingTaskLayoutProps = {
  task: string;
  cellWidth?: number;
  className?: string;
  /** Вызывается при смене текущего индекса (и при сбросе ошибки) — для синхронизации подсветки клавиши и пальцев */
  onIndexChange?: (currentIndex: number, task: string) => void;
  /** Вызывается при завершении задания (введён последний символ) */
  onComplete?: (stats: TypingTaskStats) => void;
  /** Вызывается при появлении/снятии ошибки — для подсветки Backspace (true = есть ошибка, можно удалить) */
  onErrorStateChange?: (hasError: boolean) => void;
};

export default function TypingTask({
  task,
  cellWidth = CELL_WIDTH,
  className = '',
  onIndexChange,
  onComplete,
  onErrorStateChange,
}: TypingTaskLayoutProps) {
  const chars = Array.from(task);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  const isComplete = currentIndex >= chars.length;

  // Таймер: старт при первом нажатии, стоп при завершении
  useEffect(() => {
    if (!timerStarted) return;
    if (isComplete) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerStarted, isComplete]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (chars.length === 0) return;

      if (wrongIndex !== null) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          playKeySound();
          setWrongIndex(null);
        }
        return;
      }

      if (currentIndex >= chars.length) return;

      const expected = chars[currentIndex];
      const isSpace = expected === ' ';

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        playKeySound();
        if (!timerStarted) setTimerStarted(true);

        const pressed = e.key;
        if ((isSpace && pressed === ' ') || (!isSpace && pressed === expected)) {
          setCorrectCount((c) => c + 1);
          setCurrentIndex((i) => Math.min(i + 1, chars.length));
        } else {
          setErrorCount((c) => c + 1);
          setWrongIndex(currentIndex);
        }
      } else if (e.key === ' ' && isSpace) {
        e.preventDefault();
        playKeySound();
        if (!timerStarted) setTimerStarted(true);
        setCorrectCount((c) => c + 1);
        setCurrentIndex((i) => Math.min(i + 1, chars.length));
      }
    },
    [chars, currentIndex, wrongIndex, timerStarted]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    onIndexChange?.(currentIndex, task);
  }, [currentIndex, task, wrongIndex, onIndexChange]);

  useEffect(() => {
    onErrorStateChange?.(wrongIndex !== null);
  }, [wrongIndex, onErrorStateChange]);

  useEffect(() => {
    if (currentIndex >= chars.length && chars.length > 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.({
        correct: correctCount,
        errors: errorCount,
        timeSeconds: elapsedSeconds,
      });
    }
  }, [currentIndex, chars.length, correctCount, errorCount, elapsedSeconds, onComplete]);

  return (
    <div className={`flex flex-col w-full max-w-full ${className}`} ref={containerRef}>
      <StatsBar
        correct={correctCount}
        errors={errorCount}
        timeSeconds={elapsedSeconds}
      />

      <div
        className="flex flex-col gap-3 w-full"
        style={{ marginTop: '3cm' }}
      >
        <div className="overflow-hidden border border-gray-200 rounded-lg bg-white p-1.5">
          <div className="flex flex-nowrap gap-0.5">
            <TaskRow
              chars={chars}
              currentIndex={currentIndex}
              wrongIndex={wrongIndex}
              cellWidthRem={cellWidth}
            />
          </div>
        </div>

        {isComplete && (
          <p className="text-green-700 font-medium">Готово! Время: {formatTime(elapsedSeconds)}</p>
        )}
      </div>
    </div>
  );
}

/*
  Пример использования:

  import TypingTask, { StatsBar } from './TypingTask';

  // StatsBar используется внутри TypingTask.
  // Layout: панель статистики сверху, блок задания с отступом 5cm.

  <TypingTask
    task="fff jjj ff jj fj fj fj fff j ff jjj"
    cellWidth={2.5}
    className="max-w-2xl mx-auto"
  />
*/
