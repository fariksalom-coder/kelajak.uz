'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import LessonTopBar from '@/components/lesson/LessonTopBar';
import SpeakerButton from '@/components/lesson/SpeakerButton';
import { useChildId } from '@/contexts/ChildIdContext';

const TEXTS = {
  start: 'Начать',
  next: 'Далее',
  congrats: 'Молодец! Ты справился!',
  continue: 'Продолжить',
  listen: 'Послушай',
  chooseWord: 'Выбери слово',
  completeWord: 'Дополни слово',
  xpPerStep: 10,
} as const;

const STEPS_TOTAL = 6;

type StepType = 'start' | 'letter' | 'choose_word' | 'complete_word' | 'done';

type StepConfig = {
  type: StepType;
  title?: string;
  letter?: string;
  word?: string;
  options?: string[];
  correctIndex?: number;
  prompt?: string; // e.g. "МА__" for complete-word
  /** For complete-word: letters to fill blanks in order, e.g. ['М', 'А'] for МАМА */
  correctLetters?: string[];
  optionsLetters?: string[]; // e.g. ["А", "М", "П"]
}

const STEPS: StepConfig[] = [
  { type: 'letter', title: TEXTS.listen, letter: 'А' },
  { type: 'letter', title: TEXTS.listen, letter: 'М' },
  { type: 'letter', title: TEXTS.listen, letter: 'П' },
  {
    type: 'choose_word',
    title: TEXTS.chooseWord,
    word: 'мама',
    options: ['мама', 'папа', 'ам'],
    correctIndex: 0,
  },
  {
    type: 'choose_word',
    title: TEXTS.chooseWord,
    word: 'папа',
    options: ['папа', 'мама', 'пам'],
    correctIndex: 0,
  },
  {
    type: 'complete_word',
    title: TEXTS.completeWord,
    prompt: 'МА__',
    correctLetters: ['М', 'А'],
    optionsLetters: ['А', 'М', 'П'],
  },
];

function playCorrect() {
  try {
    new Audio('/audio/correct.mp3').play().catch(() => {});
  } catch {}
}

export default function ReadingRussian1() {
  const params = useParams();
  const locale = (params.locale as string) || 'uz';
  const courseId = params.courseId as string;
  const lessonSlug = params.lessonSlug as string;
  const courseUrl = `/${locale}/child/courses/${courseId}`;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [screen, setScreen] = useState<'start' | 'lesson'>('start');
  const [answerSelected, setAnswerSelected] = useState<null | 'correct' | 'wrong'>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [earnedDots, setEarnedDots] = useState(0);
  const [startHiding, setStartHiding] = useState(false);
  /** For complete_word step: how many blanks have been filled (0 = first letter, 1 = second, …) */
  const [completeWordFilledIndex, setCompleteWordFilledIndex] = useState(0);
  const childId = useChildId();
  const resultSavedRef = useRef(false);

  const step = STEPS[currentStepIndex];
  const completed = earnedDots >= STEPS_TOTAL;

  useEffect(() => {
    if (!completed || resultSavedRef.current) return;
    resultSavedRef.current = true;
    fetch(`/api/child/${childId}/lesson-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        lessonSlug,
        xp: STEPS_TOTAL * TEXTS.xpPerStep,
      }),
    }).catch(() => {});
  }, [childId, completed, courseId, lessonSlug]);

  const handleStart = () => {
    setStartHiding(true);
    setTimeout(() => {
      setScreen('lesson');
    }, 300);
  };

  const playLetter = (letter: string) => {
    const path = `/audio/ru/letter_${letter.toLowerCase()}.mp3`;
    try {
      const a = new Audio(path);
      a.play().catch(() => {});
    } catch {}
  };

  const playWord = (word: string) => {
    const path = `/audio/ru/word_${word.replace(/\s/g, '_')}.mp3`;
    try {
      const a = new Audio(path);
      a.play().catch(() => {});
    } catch {}
  };

  const goNext = () => {
    setAnswerSelected(null);
    setSelectedIndex(null);
    setWrongIndices(new Set());
    setCompleteWordFilledIndex(0);
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((i: number) => i + 1);
    }
  };

  const handleLetterNext = () => {
    setEarnedDots((d: number) => Math.min(d + 1, STEPS_TOTAL));
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((i: number) => i + 1);
    }
  };

  const handleChooseAnswer = (index: number) => {
    if (answerSelected) return;
    setSelectedIndex(index);
    const correct = step.type === 'choose_word' && index === step.correctIndex;
    if (correct) {
      setAnswerSelected('correct');
      playCorrect();
      setEarnedDots((d: number) => Math.min(d + 1, STEPS_TOTAL));
      setTimeout(goNext, 1200);
    } else {
      setAnswerSelected('wrong');
      setWrongIndices((prev: Set<number>) => new Set(prev).add(index));
      setTimeout(() => {
        setAnswerSelected(null);
        setSelectedIndex(null);
        setWrongIndices(new Set());
      }, 1200);
    }
  };

  const handleCompleteLetter = (letter: string) => {
    if (answerSelected) return;
    const correctLetters = step.type === 'complete_word' ? (step.correctLetters ?? []) : [];
    const expectedLetter = correctLetters[completeWordFilledIndex];
    const correct = step.type === 'complete_word' && letter === expectedLetter;
    const index = step.optionsLetters?.indexOf(letter) ?? -1;
    setSelectedIndex(index);
    if (correct) {
      setAnswerSelected('correct');
      playCorrect();
      const nextFilledIndex = completeWordFilledIndex + 1;
      const allFilled = nextFilledIndex >= correctLetters.length;
      if (allFilled) {
        setEarnedDots((d: number) => Math.min(d + 1, STEPS_TOTAL));
        setTimeout(goNext, 1200);
      } else {
        setCompleteWordFilledIndex(nextFilledIndex);
        setTimeout(() => {
          setAnswerSelected(null);
          setSelectedIndex(null);
        }, 800);
      }
    } else {
      setAnswerSelected('wrong');
      setWrongIndices(new Set([index].filter((i: number) => i >= 0)));
      setTimeout(() => {
        setAnswerSelected(null);
        setSelectedIndex(null);
        setWrongIndices(new Set());
      }, 1200);
    }
  };

  if (completed) {
    return (
      <div className="min-h-[100dvh] sm:min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center p-3 sm:p-4 py-4 sm:py-6">
        <div className="w-full max-w-4xl rounded-2xl border-2 border-amber-200 bg-white shadow-xl overflow-hidden flex flex-col min-h-[320px]">
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="text-center max-w-md"
            >
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{TEXTS.congrats}</p>
              <p className="text-xl sm:text-2xl font-semibold text-amber-600 mb-8">
                +{STEPS_TOTAL * TEXTS.xpPerStep} XP
              </p>
              <Link
                href={courseUrl}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-lg transition-colors shadow-lg"
              >
                {TEXTS.continue}
                <span className="text-xl">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] sm:min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center p-3 sm:p-4 py-4 sm:py-6">
      <div className="w-full max-w-4xl rounded-2xl border-2 border-amber-200 bg-white shadow-xl overflow-hidden flex flex-col h-[calc(100dvh-2rem)] sm:h-[85vh] sm:min-h-[32rem] max-h-[900px]">
        {screen === 'start' && (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative p-6 overflow-y-auto">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none opacity-20">
              <span className="text-8xl font-bold text-amber-400">А</span>
            </div>
            <motion.button
              type="button"
              onClick={handleStart}
              initial={false}
              animate={{
                opacity: startHiding ? 0 : 1,
                scale: startHiding ? 0.95 : 1,
              }}
              className="relative z-10 px-10 py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xl font-semibold shadow-lg hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:pointer-events-none"
              disabled={startHiding}
              aria-label={TEXTS.start}
            >
              {TEXTS.start}
            </motion.button>
            <p className="mt-4 text-gray-600 text-center text-lg">Буквы и слова</p>
          </div>
        )}

        {screen === 'lesson' && step && (
          <>
            <LessonTopBar
              backHref={courseUrl}
              progressTotal={STEPS_TOTAL}
              progressCurrent={earnedDots}
            />
            <div className="flex-1 min-h-0 flex flex-col items-center p-4 sm:p-6 gap-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {step.type === 'letter' && step.letter && (
                  <motion.div
                    key={`letter-${currentStepIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-6 w-full"
                  >
                    <p className="text-lg font-medium text-gray-700">{step.title}</p>
                    <div className="flex items-center gap-4">
                      <SpeakerButton onClick={() => playLetter(step.letter!)} />
                      <span
                        className="text-7xl sm:text-8xl font-bold text-amber-600 border-b-4 border-amber-300 pb-2"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {step.letter}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLetterNext}
                      className="px-8 py-3 rounded-2xl bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium transition-colors"
                    >
                      {TEXTS.next} →
                    </button>
                  </motion.div>
                )}

                {step.type === 'choose_word' && step.options && (
                  <motion.div
                    key={`choose-${currentStepIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-6 w-full max-w-md"
                  >
                    <p className="text-lg font-medium text-gray-700">{step.title}</p>
                    <div className="flex items-center gap-3">
                      <SpeakerButton onClick={() => step.word && playWord(step.word)} />
                      <span className="text-2xl font-semibold text-gray-800">
                        Какое слово «{step.word}»?
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                      {step.options.map((opt, index) => {
                        const isCorrect = index === step.correctIndex;
                        const isSelectedCorrect = answerSelected === 'correct' && isCorrect;
                        const isWrong = wrongIndices.has(index);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleChooseAnswer(index)}
                            disabled={!!answerSelected}
                            className={`py-4 px-4 rounded-2xl border-3 text-xl font-semibold transition-all ${
                              isSelectedCorrect
                                ? 'border-green-500 bg-green-50 text-green-800'
                                : isWrong
                                  ? 'border-red-300 bg-red-50 text-red-800 animate-shake'
                                  : 'border-amber-200 bg-amber-50/50 hover:bg-amber-100 border-2'
                            } disabled:pointer-events-none`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step.type === 'complete_word' && step.optionsLetters && step.prompt && (
                  <motion.div
                    key={`complete-${currentStepIndex}-${completeWordFilledIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-6 w-full max-w-md"
                  >
                    <p className="text-lg font-medium text-gray-700">{step.title}</p>
                    <p className="text-3xl font-bold text-gray-800 tracking-widest">
                      {(() => {
                        const correctLetters = step.correctLetters ?? [];
                        let blankIndex = 0;
                        return step.prompt
                          .split('')
                          .map((c) => {
                            if (c === '_') {
                              const letter =
                                blankIndex < completeWordFilledIndex
                                  ? correctLetters[blankIndex]
                                  : '_';
                              blankIndex++;
                              return letter;
                            }
                            return c;
                          })
                          .join('');
                      })()}
                    </p>
                    <p className="text-gray-600">Выбери нужную букву:</p>
                    <div className="flex flex-wrap justify-center gap-4">
                      {step.optionsLetters.map((letter, index) => {
                        const expectedLetter = (step.correctLetters ?? [])[completeWordFilledIndex];
                        const isCorrect = letter === expectedLetter;
                        const isSelectedCorrect = answerSelected === 'correct' && isCorrect;
                        const isWrong = wrongIndices.has(index);
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => handleCompleteLetter(letter)}
                            disabled={!!answerSelected}
                            className={`w-16 h-16 rounded-2xl border-2 text-3xl font-bold transition-all flex items-center justify-center ${
                              isSelectedCorrect
                                ? 'border-green-500 bg-green-50 text-green-800'
                                : isWrong
                                  ? 'border-red-300 bg-red-50 text-red-800 animate-shake'
                                  : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                            } disabled:pointer-events-none`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
