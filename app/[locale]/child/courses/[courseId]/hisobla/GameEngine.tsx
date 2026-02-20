'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameMode, Level, Task } from './types';
import { TOTAL_TASKS, ROUNDS_COUNT, TASKS_PER_ROUND } from './types';
import { generateTask } from './TaskGenerator';
import { rectFromDom, checkOverlap } from './CollisionSystem';
import { POINTS_PER_CORRECT, saveRecord } from './ScoreSystem';
import { AnswerOptions } from './AnswerOptions';

const CARD_SPEED_PX_S = 281.25; /* ещё +50% от 187.5 */
const WRONG_FLASH_MS = 400;
const TASK_START_X_OFFSET = 100;
/** Когда карточки уехали левее этой позиции, считаем что они «до конца экрана» и спавним следующую задачу */
const OFF_SCREEN_THRESHOLD_PX = 800;

function getInitialX() {
  return typeof window !== 'undefined' ? window.innerWidth + TASK_START_X_OFFSET : 1000;
}

function playSuccessSound() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore
  }
}

function playWrongSound() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // ignore
  }
}

export interface GameEngineProps {
  mode: GameMode;
  heroRef: React.RefObject<HTMLDivElement | null>;
  score: number;
  onScoreChange: (score: number) => void;
  soundOn: boolean;
  onGameComplete: (finalScore: number) => void;
  onClose?: () => void;
  onRestart?: () => void;
  onNextLevel?: () => void;
  fixedTasks?: Task[] | null;
}

export function GameEngine({
  mode,
  heroRef,
  score,
  onScoreChange,
  soundOn,
  onGameComplete,
  onClose,
  onRestart,
  onNextLevel,
  fixedTasks,
}: GameEngineProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [taskPositionX, setTaskPositionX] = useState(getInitialX);
  const [isTaskMoving, setIsTaskMoving] = useState(true);
  const [flashWrongIndex, setFlashWrongIndex] = useState<number | null>(null);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverScore, setGameOverScore] = useState(0);

  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef(0);
  const collidedRef = useRef(false);
  const optionRefsRef = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const fixedTasksRef = useRef<Task[] | null | undefined>(undefined);
  const taskPositionXRef = useRef(taskPositionX);
  const isTaskMovingRef = useRef(isTaskMoving);
  const currentTaskIndexRef = useRef(currentTaskIndex);
  const currentRoundRef = useRef(currentRound);
  /** Индекс следующей задачи; спавн когда текущие карточки уедут за левый край экрана */
  const pendingNextIndexRef = useRef<number | null>(null);

  const TASKS_PER_LEVEL = 20;

  fixedTasksRef.current = fixedTasks;
  taskPositionXRef.current = taskPositionX;
  isTaskMovingRef.current = isTaskMoving;
  currentTaskIndexRef.current = currentTaskIndex;
  currentRoundRef.current = currentRound;

  const activeTask = tasks[currentTaskIndex] ?? null;

  const setOptionRef = useCallback((i: number, el: HTMLDivElement | null) => {
    optionRefsRef.current[i] = el;
  }, []);

  useEffect(() => {
    const initialX = getInitialX();
    const tasksToUse = fixedTasksRef.current;
    if (tasksToUse && tasksToUse.length > 0) {
      setTasks(tasksToUse);
    } else {
      const level = Math.min(4, currentRound) as Level;
      const initial: Task[] = [];
      for (let i = 0; i < TOTAL_TASKS; i++) {
        const round = Math.floor(i / TASKS_PER_ROUND) + 1;
        const lvl = Math.min(4, round) as Level;
        initial.push(generateTask(lvl, mode));
      }
      setTasks(initial);
    }
    setCurrentTaskIndex(0);
    currentTaskIndexRef.current = 0;
    setCurrentRound(1);
    setTaskPositionX(initialX);
    taskPositionXRef.current = initialX;
    setIsTaskMoving(true);
    isTaskMovingRef.current = true;
    collidedRef.current = false;
  }, [mode]);

  /** Единый игровой цикл: движение карточки влево + отложенный спавн следующей задачи */
  useEffect(() => {
    if (tasks.length === 0 || gameComplete || gameOver) return;

    const gameLoop = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const nextIndex = pendingNextIndexRef.current;
      if (nextIndex !== null && taskPositionXRef.current < -OFF_SCREEN_THRESHOLD_PX) {
        pendingNextIndexRef.current = null;
        const initialX = getInitialX();
        setTaskPositionX(initialX);
        taskPositionXRef.current = initialX;
        setCurrentTaskIndex(nextIndex);
        currentTaskIndexRef.current = nextIndex;
        const nextRound = Math.floor(nextIndex / TASKS_PER_ROUND) + 1;
        setCurrentRound(nextRound);
        currentRoundRef.current = nextRound;
        setCorrectOptionIndex(null);
        setIsTaskMoving(true);
        isTaskMovingRef.current = true;
        collidedRef.current = false;
      }

      const isAdditionLevel = (fixedTasksRef.current?.length ?? 0) > 0;
      const level = isAdditionLevel
        ? Math.floor(currentTaskIndexRef.current / TASKS_PER_LEVEL) + 1
        : currentRoundRef.current;
      const speed = CARD_SPEED_PX_S * Math.pow(1.15, level - 1);

      if (isTaskMovingRef.current) {
        const nextX = taskPositionXRef.current - speed * dt;
        taskPositionXRef.current = nextX;
        setTaskPositionX(nextX);
      }

      rafIdRef.current = requestAnimationFrame(gameLoop);
    };
    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [tasks.length, gameComplete, gameOver]);

  /** Коллизия с вариантами ответа */
  useEffect(() => {
    if (tasks.length === 0 || currentTaskIndex >= tasks.length || gameComplete || gameOver) return;

    const hero = heroRef.current;
    if (!hero || !activeTask) return;

    const interval = setInterval(() => {
      const heroRect = rectFromDom(hero);
      if (!heroRect) return;

      const refs = optionRefsRef.current;
      for (let i = 0; i < 3; i++) {
        const optEl = refs[i];
        if (!optEl) continue;
        const optRect = rectFromDom(optEl);
        if (!optRect) continue;
        if (!checkOverlap(heroRect, optRect, 12)) continue;

        if (collidedRef.current) break;
        collidedRef.current = true;

        const value = activeTask.options[i];
        if (value === activeTask.correct) {
          const newScore = score + POINTS_PER_CORRECT;
          if (soundOn) playSuccessSound();
          onScoreChange(newScore);
          setCorrectOptionIndex(i);

          const nextIndex = currentTaskIndex + 1;
          if (nextIndex >= tasks.length) {
            setFinalScore(newScore);
            setGameComplete(true);
            saveRecord(mode, newScore);
            onGameComplete(newScore);
          } else {
            pendingNextIndexRef.current = nextIndex;
          }
        } else {
          if (soundOn) playWrongSound();
          setFlashWrongIndex(i);
          setGameOver(true);
          setGameOverScore(score);
        }
        break;
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [
    tasks,
    activeTask,
    currentTaskIndex,
    gameComplete,
    gameOver,
    heroRef,
    score,
    onScoreChange,
    onGameComplete,
    mode,
    soundOn,
  ]);

  if (gameComplete) {
    return (
      <div className="fixed inset-0 z-[10] flex items-center justify-center bg-black/40 pointer-events-auto p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center">
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Yakunlandi!</p>
          <p className="text-xl text-sky-600 font-semibold mb-6">Ball: {finalScore}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => (onNextLevel ?? onRestart)?.()}
              className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg transition-colors active:scale-[0.98]"
            >
              Keyingi daraja
            </button>
            <button
              type="button"
              onClick={() => onRestart?.()}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-lg transition-colors active:scale-[0.98]"
            >
              Qayta urinish
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg transition-colors active:scale-[0.98]"
            >
              Orqaga
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="fixed inset-0 z-[10] flex items-center justify-center bg-black/50 pointer-events-auto p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center">
          <p className="text-xl font-bold text-gray-800 mb-2">Siz {gameOverScore} ball to&apos;pladingiz</p>
          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={() => onRestart?.()}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold"
            >
              Qayta urinish
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
            >
              Chiqish
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0 || !activeTask) return null;

  return (
    <AnswerOptions
      key={`task-${currentTaskIndex}-${activeTask.question}`}
      task={activeTask}
      cardOffsetX={taskPositionX}
      setOptionRef={setOptionRef}
      flashWrongIndex={flashWrongIndex}
      correctOptionIndex={correctOptionIndex}
    />
  );
}
