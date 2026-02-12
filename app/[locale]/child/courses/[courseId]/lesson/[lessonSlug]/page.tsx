'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import CharacterAvatar from '@/components/lesson/CharacterAvatar';
import Cube from '@/components/lesson/Cube';
import RotateDeviceOverlay from '@/components/lesson/RotateDeviceOverlay';
import SpeakerButton from '@/components/lesson/SpeakerButton';
import { useLandscapeForTask } from '@/hooks/useLandscapeForTask';
import { useChildId } from '@/contexts/ChildIdContext';
import ReadingRussian1 from './reading_russian_1/reading_russian_1';

const TEXTS = {
  start: 'Boshlash',
  next: 'Davom etish',
  congrats: 'Tabriklaymiz, barakalla!',
  hpPerCircle: 10,
  continue: 'Davom etish',
} as const;

type Screen = 'start' | 'explanation' | 'question';

const SUBTASKS_TOTAL = 6;

type NumberStyle = { fontFamily: string; color: string; fontSize: string };

type TaskConfig = {
  number: number;
  question: string;
  options: Array<{
    name: 'Akram' | 'Soliha' | 'Ali';
    cubes: number;
    number: string;
    numberStyle?: NumberStyle;
  }>;
  correctIndex: number;
  /** В заданиях 4–6: стиль числа в предложении и над кубиком (разные шрифты и цвета) */
  mainNumberStyle?: NumberStyle;
};

const TASKS: TaskConfig[] = [
  {
    number: 1,
    question: 'Yana kimda 1 ta kubik bor?',
    options: [
      { name: 'Akram', cubes: 2, number: '2' },
      { name: 'Soliha', cubes: 1, number: '1' },
      { name: 'Ali', cubes: 3, number: '3' },
    ],
    correctIndex: 1,
  },
  {
    number: 2,
    question: 'Yana kimda 2 ta kubik bor?',
    options: [
      { name: 'Ali', cubes: 1, number: '1' },
      { name: 'Akram', cubes: 2, number: '2' },
      { name: 'Soliha', cubes: 3, number: '3' },
    ],
    correctIndex: 1,
  },
  {
    number: 3,
    question: 'Yana kimda 3 ta kubik bor?',
    options: [
      { name: 'Soliha', cubes: 1, number: '1' },
      { name: 'Ali', cubes: 2, number: '2' },
      { name: 'Akram', cubes: 3, number: '3' },
    ],
    correctIndex: 2,
  },
  // 4-е задание: данные как в 3-м, числа разноцветные и разные шрифты (одно и то же число отличается по виду)
  {
    number: 3,
    question: 'Yana kimda 3 ta kubik bor?',
    options: [
      {
        name: 'Soliha',
        cubes: 1,
        number: '1',
        numberStyle: { fontFamily: "'Georgia', serif", color: '#059669', fontSize: '4.5rem' },
      },
      {
        name: 'Ali',
        cubes: 2,
        number: '2',
        numberStyle: { fontFamily: "'Comic Sans MS', 'Chalkboard', cursive", color: '#7c3aed', fontSize: '3.5rem' },
      },
      {
        name: 'Akram',
        cubes: 3,
        number: '3',
        numberStyle: { fontFamily: "'Courier New', monospace", color: '#dc2626', fontSize: '5.5rem' },
      },
    ],
    correctIndex: 2,
    mainNumberStyle: { fontFamily: "'Georgia', serif", color: '#059669', fontSize: '4.5rem' },
  },
  // 5-е задание: данные как во 2-м (число 2), другие шрифты и цвета
  {
    number: 2,
    question: 'Yana kimda 2 ta kubik bor?',
    options: [
      { name: 'Ali', cubes: 1, number: '1', numberStyle: { fontFamily: 'Verdana, sans-serif', color: '#0284c7', fontSize: '4.5rem' } },
      { name: 'Akram', cubes: 2, number: '2', numberStyle: { fontFamily: "'Trebuchet MS', sans-serif", color: '#a21caf', fontSize: '3.5rem' } },
      { name: 'Soliha', cubes: 3, number: '3', numberStyle: { fontFamily: 'Impact, Charcoal, sans-serif', color: '#b91c1c', fontSize: '5.5rem' } },
    ],
    correctIndex: 1,
    mainNumberStyle: { fontFamily: 'Verdana, sans-serif', color: '#0284c7', fontSize: '4.5rem' },
  },
  // 6-е задание: данные как в 1-м (число 1), другие шрифты и цвета
  {
    number: 1,
    question: 'Yana kimda 1 ta kubik bor?',
    options: [
      { name: 'Akram', cubes: 2, number: '2', numberStyle: { fontFamily: "'Comic Sans MS', cursive", color: '#ca8a04', fontSize: '3.5rem' } },
      { name: 'Soliha', cubes: 1, number: '1', numberStyle: { fontFamily: "'Courier New', monospace", color: '#0d9488', fontSize: '5.5rem' } },
      { name: 'Ali', cubes: 3, number: '3', numberStyle: { fontFamily: "'Arial Black', Gadget, sans-serif", color: '#1e3a8a', fontSize: '4.5rem' } },
    ],
    correctIndex: 1,
    mainNumberStyle: { fontFamily: "'Arial Black', Gadget, sans-serif", color: '#1e3a8a', fontSize: '4.5rem' },
  },
];

export default function LessonPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const courseId = (params?.courseId as string) ?? '';
  const lessonSlug = (params?.lessonSlug as string) ?? '';
  const asChild = searchParams.get('asChild');
  const linkSuffix = asChild ? `?asChild=${asChild}` : '';
  const courseUrl = courseId ? `/${locale}/child/courses/${courseId}${linkSuffix}` : `/${locale}/child${linkSuffix}`;

  const [screen, setScreen] = useState<Screen>('start');
  const [startButtonHiding, setStartButtonHiding] = useState(false);
  const [numberOneFlying, setNumberOneFlying] = useState(false);
  const [flyPx, setFlyPx] = useState<{ x: number[]; y: number[] } | null>(null);
  /** Очередь заданий */
  const [taskQueue, setTaskQueue] = useState<number[]>(() => [0, 1, 2]);
  const [answerSelected, setAnswerSelected] = useState<null | 'correct' | 'wrong'>(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [wrongCardIndices, setWrongCardIndices] = useState<Set<number>>(new Set());
  /** В первых 3 заданиях: за какими заданиями уже «заработан» кружок (макс 1 на задание); при ошибке забираем */
  const [earnedCirclesForTasks, setEarnedCirclesForTasks] = useState<Set<number>>(new Set());
  /** Была ли уже ошибка в текущем задании (второй раз правильный — кружок не даём) */
  const [hadWrongAttemptInCurrentTask, setHadWrongAttemptInCurrentTask] = useState(false);
  /** Задания, решённые с ошибкой (для раунда повтора: сначала любое из 2 правильных, потом неправильное) */
  const [failedTaskIndices, setFailedTaskIndices] = useState<Set<number>>(new Set());
  /** В раунде повтора: повтор «правильного» задания — за правильный ответ кружок не даём, за ошибку забираем 1 */
  const [repeatRoundCorrectTaskIndices, setRepeatRoundCorrectTaskIndices] = useState<Set<number>>(new Set());
  /** На экране объяснения: сначала только значок аудио (вместо кнопки), после прослушивания — значок у текста и кнопка «Далее» */
  const [explanationIntroPlayed, setExplanationIntroPlayed] = useState(false);

  const arcContainerRef = useRef<HTMLDivElement>(null);
  const cubeColumnRef = useRef<HTMLDivElement>(null);
  const textOneRef = useRef<HTMLSpanElement>(null);
  const lessonContainerRef = useRef<HTMLDivElement>(null);
  const { requestLandscape, showRotatePrompt } = useLandscapeForTask({
    containerRef: lessonContainerRef,
    isActive: lessonSlug === '1-2-3-kirish',
  });
  const completedSubtasks = Math.min(earnedCirclesForTasks.size, SUBTASKS_TOTAL);
  const completedSubtasksRef = useRef(completedSubtasks);
  completedSubtasksRef.current = completedSubtasks;
  const childId = useChildId();
  const resultSavedRef = useRef(false);

  useEffect(() => {
    if (completedSubtasks !== SUBTASKS_TOTAL) return;
    if (resultSavedRef.current) return;
    resultSavedRef.current = true;

    fetch(`/api/child/${childId}/lesson-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        lessonSlug,
        xp: completedSubtasks * TEXTS.hpPerCircle,
      }),
    }).catch(() => {});
  }, [childId, completedSubtasks, courseId, lessonSlug]);

  const taskIndex = taskQueue[0] ?? 0;
  const playAudio = (src: string) => {
    try {
      const audio = new Audio(src);
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  };
  const playExplanationIntro = () => {
    try {
      const audio = new Audio(`/audio/${currentTask.number}ta_kubik.mp3`);
      audio.addEventListener('ended', () => setExplanationIntroPlayed(true));
      audio.play().catch(() => setExplanationIntroPlayed(true));
    } catch {
      setExplanationIntroPlayed(true);
    }
  };
  const progressCurrent =
    screen === 'start' ? 1 : screen === 'explanation' ? 2 : answerSelected === 'correct' ? 4 : 3;
  const currentTask = TASKS[taskIndex];

  /** Следующее задание в круге 4→5→6→4…; пропускаем задания, за которые уже дали кружок */
  const getNextTask456 = (current: number, earned: Set<number>) => {
    const order = current === 3 ? [4, 5, 3] : current === 4 ? [5, 3, 4] : [3, 4, 5];
    const next = order.find((i) => !earned.has(i));
    return next ?? order[0];
  };

  /** При 3 кружках переходим в 4-е задание; иначе — заново даём три задания */
  const scheduleRestartIfNeeded = () => {
    setTimeout(() => {
      if (completedSubtasksRef.current >= 3) {
        setTaskQueue([3]);
        setFailedTaskIndices(new Set());
        setRepeatRoundCorrectTaskIndices(new Set());
        setAnswerSelected(null);
        setSelectedAnswerIndex(null);
        setWrongCardIndices(new Set());
        setHadWrongAttemptInCurrentTask(false);
setScreen('explanation');
            setExplanationIntroPlayed(false);
          } else {
        setTaskQueue([0, 1, 2]);
        setFailedTaskIndices(new Set());
        setRepeatRoundCorrectTaskIndices(new Set());
        setAnswerSelected(null);
        setSelectedAnswerIndex(null);
        setWrongCardIndices(new Set());
        setHadWrongAttemptInCurrentTask(false);
        setScreen('explanation');
        setExplanationIntroPlayed(false);
      }
    }, 1800);
  };

  const handleStart = () => {
    requestLandscape();
    setStartButtonHiding(true);
    setTimeout(() => {
      setScreen('explanation');
      setExplanationIntroPlayed(false);
    }, 350);
  };

  const handleKeyingi = () => {
    const container = arcContainerRef.current;
    const cubeCol = cubeColumnRef.current;
    const textOne = textOneRef.current;
    if (container && cubeCol && textOne) {
      const cr = container.getBoundingClientRect();
      const cubeR = cubeCol.getBoundingClientRect();
      const textR = textOne.getBoundingClientRect();
      const size = 24;
      const startX = textR.left - cr.left + textR.width / 2 - size;
      const startY = textR.top - cr.top + textR.height / 2 - size;
      const endX = cubeR.left - cr.left + cubeR.width / 2 - size;
      const endY = cubeR.top - cr.top - 10 - size;
      const arcHeight = 55;
      const points = 24;
      const x: number[] = [];
      const y: number[] = [];
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        x.push(startX + t * (endX - startX));
        y.push(
          startY + t * (endY - startY) - arcHeight * 4 * t * (1 - t)
        );
      }
      setFlyPx({ x, y });
    }
    setNumberOneFlying(true);
    setTimeout(() => {
      setNumberOneFlying(false);
      setScreen('question');
    }, 750);
  };

  const handleAnswer = (index: number) => {
    if (answerSelected) return;
    setSelectedAnswerIndex(index);
    const correct = index === currentTask.correctIndex;
    const isRepeatOfCorrectTask = repeatRoundCorrectTaskIndices.has(taskIndex);

    if (correct) {
      setAnswerSelected('correct');
      try {
        const audio = new Audio('/audio/correct.mp3');
        audio.play().catch(() => {});
      } catch {
        // игнорируем ошибки воспроизведения
      }
      // Задания 1–3: макс 1 кружок на задание, только с первой попытки
      if (taskIndex <= 2 && !hadWrongAttemptInCurrentTask && !isRepeatOfCorrectTask) {
        setEarnedCirclesForTasks((prev) => new Set(prev).add(taskIndex));
      }
      // Задания 4–6: за правильный — кружок и переход по кругу (пропуская решённые); за неправильный — без кружка, сразу следующий по кругу
      if (taskIndex >= 3 && taskIndex <= 5) {
        setEarnedCirclesForTasks((prev) => new Set(prev).add(taskIndex));
        const earnedAfter = new Set(earnedCirclesForTasks).add(taskIndex);
        if (earnedAfter.size >= SUBTASKS_TOTAL) {
          // 6 кружков — задание завершено, экран поздравления покажется при следующем рендере
          return;
        }
        const next = getNextTask456(taskIndex, earnedAfter);
        setTimeout(() => {
          setTaskQueue([next]);
          setAnswerSelected(null);
          setSelectedAnswerIndex(null);
          setWrongCardIndices(new Set());
          setHadWrongAttemptInCurrentTask(false);
          setScreen('explanation');
          setExplanationIntroPlayed(false);
        }, 1800);
        return;
      }
      // Запомнить задание как решённое с ошибкой только в основном раунде (для раунда повтора в конце)
      if (hadWrongAttemptInCurrentTask && repeatRoundCorrectTaskIndices.size === 0) {
        setFailedTaskIndices((prev) => new Set(prev).add(taskIndex));
      }

      setTaskQueue((queue) => {
        const completed = queue[0];
        const rest = queue.slice(1);

        const effectiveFailed = hadWrongAttemptInCurrentTask
          ? new Set(failedTaskIndices).add(completed)
          : new Set(failedTaskIndices);

        // Раунд повтора закончился — при 3 кружках переходим в 4-е, иначе снова три задания
        if (rest.length === 0 && repeatRoundCorrectTaskIndices.size > 0) {
          setRepeatRoundCorrectTaskIndices(new Set());
          scheduleRestartIfNeeded();
          return [completed];
        }

        if (rest.length > 0) {
          const nextQueue = rest;
          setTimeout(() => {
            setTaskQueue(nextQueue);
            setAnswerSelected(null);
            setSelectedAnswerIndex(null);
            setWrongCardIndices(new Set());
            setHadWrongAttemptInCurrentTask(false);
            setRepeatRoundCorrectTaskIndices((prev) => {
              const next = new Set(prev);
              next.delete(completed);
              return next;
            });
            setScreen('explanation');
            setExplanationIntroPlayed(false);
          }, 1800);
          return queue;
        }

        if (effectiveFailed.size > 0) {
          // 2 из 3 правильных: даём сначала любое из 2 правильных, потом неправильное
          const correctIndices = [0, 1, 2].filter((i) => !effectiveFailed.has(i));
          const pickedCorrect = correctIndices[0];
          const nextQueue = [pickedCorrect, ...Array.from(effectiveFailed)];
          setTimeout(() => {
            setTaskQueue(nextQueue);
            setAnswerSelected(null);
            setSelectedAnswerIndex(null);
            setWrongCardIndices(new Set());
            setHadWrongAttemptInCurrentTask(false);
            setRepeatRoundCorrectTaskIndices(new Set([pickedCorrect]));
            setFailedTaskIndices(new Set());
            setScreen('explanation');
            setExplanationIntroPlayed(false);
          }, 1800);
          return queue;
        }

        // Основной раунд закончился без неправильных — если кружков < 3, снова даём три задания
        scheduleRestartIfNeeded();
        return [completed];
      });
    } else {
      // Задания 4–6: неправильно — кружок не даём, сразу переходим к следующему по кругу (пропуская решённые)
      if (taskIndex >= 3 && taskIndex <= 5) {
        setAnswerSelected('wrong');
        setWrongCardIndices((prev) => new Set(prev).add(index));
        const next = getNextTask456(taskIndex, earnedCirclesForTasks);
        setTimeout(() => {
          setTaskQueue([next]);
          setAnswerSelected(null);
          setSelectedAnswerIndex(null);
          setWrongCardIndices(new Set());
          setScreen('explanation');
          setExplanationIntroPlayed(false);
        }, 1500);
        return;
      }
      setAnswerSelected('wrong');
      setHadWrongAttemptInCurrentTask(true);
      // За неправильный ответ забираем кружок, выданный за это задание (только задания 0–2)
      if (taskIndex <= 2) {
        setEarnedCirclesForTasks((prev) => {
          const next = new Set(prev);
          next.delete(taskIndex);
          return next;
        });
      }
      setWrongCardIndices((prev) => new Set(prev).add(index));
      setTimeout(() => {
        setAnswerSelected(null);
        setSelectedAnswerIndex(null);
        setWrongCardIndices(new Set());
      }, 1500);
    }
  };

  if (!params?.lessonSlug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 animate-pulse">Yuklanmoqda...</p>
        <Link href={courseUrl} className="mt-4 text-sky-600 hover:underline">
          Orqaga
        </Link>
      </div>
    );
  }

  if (lessonSlug === 'reading-russian-1') {
    return <ReadingRussian1 />;
  }

  if (lessonSlug !== '1-2-3-kirish') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Dars topilmadi.</p>
        <Link href={courseUrl} className="text-sky-600 hover:underline">
          Kursga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div ref={lessonContainerRef} className="min-h-[100dvh] sm:min-h-screen bg-gray-100 flex flex-col items-center p-3 sm:p-4 py-4 sm:py-6 relative">
      {showRotatePrompt && <RotateDeviceOverlay />}
      {/* Рамка задания: высокая, на телефоне — по экрану, контент прокручивается */}
      <div className="w-full max-w-4xl rounded-2xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden flex flex-col h-[calc(100dvh-2rem)] sm:h-[85vh] sm:min-h-[32rem] max-h-[900px]">
        {/* На экране поздравления шапку (назад + кружки) не показываем */}
        {completedSubtasks !== SUBTASKS_TOTAL && (
          <div className="relative flex items-center justify-between px-4 py-3 border-b-2 border-gray-200 bg-gray-50 shrink-0 min-h-[3rem]">
            <Link
              href={courseUrl}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium z-10"
            >
              <span className="text-lg leading-none" aria-hidden>←</span>
              Orqaga
            </Link>
            <div
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-8 py-2.5 rounded-full bg-gray-100 border border-gray-200/80 min-w-[24rem]"
              style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}
              role="progressbar"
              aria-valuenow={completedSubtasks}
              aria-valuemin={0}
              aria-valuemax={SUBTASKS_TOTAL}
              aria-label={`${completedSubtasks} из ${SUBTASKS_TOTAL} подзадач`}
            >
              {Array.from({ length: SUBTASKS_TOTAL - completedSubtasks }, (_, i) => (
                <span
                  key={i}
                  className="w-5 h-5 rounded-full shrink-0 bg-green-500 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.4),inset_0_1px_0_rgba(0,0,0,0.1)] transition-all duration-[1.2s] ease-in-out"
                  aria-hidden
                />
              ))}
              {completedSubtasks > 0 && (
                <div className="ml-auto flex items-center gap-1.5 transition-all duration-[1.2s] ease-in-out">
                  {Array.from({ length: completedSubtasks }, (_, i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-full shrink-0 bg-green-500 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.4),inset_0_1px_0_rgba(0,0,0,0.1)] transition-all duration-[1.2s] ease-in-out"
                      aria-hidden
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="w-16 shrink-0" aria-hidden />
          </div>
        )}

        {/* Экран завершения: 6 кружков — поздравление, XP, кнопка «Продолжить» */}
        {completedSubtasks === SUBTASKS_TOTAL ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="text-center max-w-md">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                {TEXTS.congrats}
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-green-600 mb-8">
                Jami: {completedSubtasks * TEXTS.hpPerCircle} XP
              </p>
              <Link
                href={courseUrl}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-medium text-lg transition-colors shadow-md"
              >
                {TEXTS.continue}
                <span className="text-xl">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
        {/* Screen 1 — Start */}
        {screen === 'start' && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <div className="flex items-center gap-4 opacity-30 blur-md scale-90">
                <CharacterAvatar name="Lola" size="lg" priority />
                <Cube count={TASKS[0].number} />
                <span className="text-lg text-gray-500">Lolada {TASKS[0].number} ta kubik bor</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStart}
              className={`relative z-10 w-24 h-24 rounded-full bg-purple-500 hover:bg-purple-600 text-white flex flex-col items-center justify-center gap-0 shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                startButtonHiding ? 'opacity-0 scale-95 pointer-events-none' : ''
              }`}
              aria-label={TEXTS.start}
            >
              <span className="text-4xl leading-none">▶</span>
              <span className="text-sm font-medium mt-1">{TEXTS.start}</span>
            </button>
          </div>
        )}

        {/* Экран объяснения и вопроса — одна общая вёрстка: Лола и кубик не перерисовываются и не двигаются */}
        {(screen === 'explanation' || screen === 'question') && (
          <div className="flex-1 min-h-0 flex flex-col items-start p-4 sm:p-6 gap-5 overflow-y-auto">
            <div ref={arcContainerRef} className="relative w-full min-h-[140px] sm:min-h-[180px]">
              {/* Первая строка одна и та же — кубик и Лола не двигаются при переходе */}
              <div className="flex flex-row items-start gap-3 w-full flex-wrap">
                <div className="flex flex-row items-center gap-3 shrink-0">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <CharacterAvatar name="Lola" size="lg" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-700">Lola</span>
                      <SpeakerButton onClick={() => playAudio('/audio/lola.mp3')} />
                    </div>
                  </div>
                  <div ref={cubeColumnRef} className="relative flex flex-col items-center gap-1">
                    {screen === 'question' && (
                      currentTask.mainNumberStyle ? (
                        <span
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 font-bold"
                          style={{
                            fontFamily: currentTask.mainNumberStyle.fontFamily,
                            color: currentTask.mainNumberStyle.color,
                            fontSize: currentTask.mainNumberStyle.fontSize,
                          }}
                        >
                          {currentTask.number}
                        </span>
                      ) : (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-7xl font-bold text-gray-800">
                          {currentTask.number}
                        </span>
                      )
                    )}
                    <Cube count={currentTask.number} />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 min-w-0 ml-auto mr-8 sm:mr-12 -translate-x-[2cm] mt-[calc(1rem+1cm)] sm:mt-[calc(1.5rem+1cm)]">
                  <div className="flex items-center gap-2">
                    {screen === 'explanation' && !explanationIntroPlayed ? (
                      <span className="flex shrink-0 w-14 h-14 mt-3" aria-hidden />
                    ) : (
                      <span className="flex shrink-0 items-center justify-center mt-3">
                        <SpeakerButton onClick={() => playAudio(`/audio/${currentTask.number}ta_kubik.mp3`)} />
                      </span>
                    )}
                    <p className="m-0 text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 leading-tight">
                      Lolada{' '}
                      {currentTask.mainNumberStyle ? (
                        <strong
                          ref={textOneRef}
                          style={{
                            fontFamily: currentTask.mainNumberStyle.fontFamily,
                            color: currentTask.mainNumberStyle.color,
                            fontSize: currentTask.mainNumberStyle.fontSize,
                          }}
                        >
                          {currentTask.number}
                        </strong>
                      ) : (
                        <strong ref={textOneRef} className="text-4xl sm:text-5xl md:text-7xl">{currentTask.number}</strong>
                      )}{' '}
                      ta kubik bor
                    </p>
                  </div>
                  {screen === 'explanation' && (
                    explanationIntroPlayed ? (
                      <button
                        type="button"
                        onClick={handleKeyingi}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-sky-100 text-sky-700 hover:bg-sky-200 font-medium transition-colors mt-[1cm]"
                      >
                        {TEXTS.next}
                        <span className="text-lg">→</span>
                      </button>
                    ) : (
                      <span className="mt-[1cm] flex shrink-0">
                        <SpeakerButton onClick={playExplanationIntro} />
                      </span>
                    )
                  )}
                </div>
              </div>
              {screen === 'explanation' && numberOneFlying && flyPx && (
                <motion.span
                  className="absolute left-0 top-0 font-bold pointer-events-none z-10 w-24 h-24 flex items-center justify-center"
                  style={currentTask.mainNumberStyle ? {
                    fontFamily: currentTask.mainNumberStyle.fontFamily,
                    color: currentTask.mainNumberStyle.color,
                    fontSize: currentTask.mainNumberStyle.fontSize,
                  } : undefined}
                  initial={{ x: flyPx.x[0], y: flyPx.y[0], scale: 1 }}
                  animate={{
                    x: flyPx.x,
                    y: flyPx.y,
                    scale: [...Array(flyPx.x.length)].map((_, i) => {
                      const t = i / (flyPx.x.length - 1);
                      return 1 + 0.1 * 4 * t * (1 - t);
                    }),
                  }}
                  transition={{
                    duration: 0.7,
                    ease: 'easeInOut',
                    times: flyPx.x.map((_, i) => i / (flyPx.x.length - 1)),
                  }}
                  aria-hidden
                >
                  {currentTask.mainNumberStyle ? currentTask.number : <span className="text-6xl sm:text-8xl text-gray-800">{currentTask.number}</span>}
                </motion.span>
              )}
            </div>

            {/* Ниже только на экране вопроса — плавное появление */}
            {screen === 'question' && (
              <div className="w-full flex flex-col gap-4 sm:gap-5 animate-fade-in">
                <div className="flex items-center justify-center gap-2 w-full flex-wrap">
                  <span className="flex shrink-0 items-center justify-center">
                    <SpeakerButton onClick={() => playAudio(`/audio/kimda_${currentTask.number}ta.mp3`)} />
                  </span>
                  <p className="m-0 text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                    {currentTask.question}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  {currentTask.options.map(({ name, cubes, number, numberStyle }, index) => {
                    const style = { animationDelay: `${index * 0.1}s` };
                    const isCorrect = index === currentTask.correctIndex;
                    const isSelectedCorrect = answerSelected === 'correct' && isCorrect;
                    const isWrong = wrongCardIndices.has(index);
                    const numberEl = numberStyle ? (
                      <span
                        className="font-bold"
                        style={{
                          fontFamily: numberStyle.fontFamily,
                          color: numberStyle.color,
                          fontSize: numberStyle.fontSize,
                        }}
                      >
                        {number}
                      </span>
                    ) : (
                      <span className="text-6xl font-bold text-gray-800">{number}</span>
                    );
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAnswer(index)}
                        disabled={!!answerSelected}
                        style={style}
                        className={`animate-slide-up flex flex-row items-center justify-start gap-1 pl-1 pr-4 py-4 rounded-2xl border-[3px] bg-white transition-all opacity-0 ${
                          isSelectedCorrect
                            ? 'border-green-500 bg-green-50'
                            : isWrong
                              ? 'border-red-300 bg-red-50/50 animate-shake'
                              : 'border-gray-300 shadow-sm hover:border-sky-400 hover:bg-sky-50/50'
                        } ${answerSelected ? 'pointer-events-none' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <CharacterAvatar name={name} size="md" />
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm font-medium text-gray-700">{name}</span>
                            <SpeakerButton onClick={() => playAudio(`/audio/${name.toLowerCase()}.mp3`)} />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                          {numberEl}
                          <Cube count={cubes} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
