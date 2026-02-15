'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

const CHAPTER1_QUESTION = 'Moliyaviy savodxonlik nima?';
const CHAPTER1_OPTIONS = [
  'kompasdan foydalana bilish',
  'odamlar bilan muomala qila olish',
  'pulni ishlatish qobiliyati',
  'xayolda sanay bilish',
];
const CHAPTER1_CORRECT_INDEX = 2;

const CHAPTER1_SLIDE15_TITLE = "Keling, ta'rifni tuzamiz";
const CHAPTER1_SLIDE15_GAPS: { correct: string; options: string[] }[] = [
  { correct: "to'g'ri", options: ["noto'g'ri", "to'g'ri", "tez"] },
  { correct: "sarflash", options: ["sarflash", "mehnat", "kasb"] },
  { correct: "to'g'ri", options: ["to'g'ri", "yomon", "pul"] },
  { correct: "mas'uliyatni", options: ["mas'uliyatni", "yukni", "sababni"] },
];

const CHAPTER1_IMAGES = [
  '/courses/finance/chapter-1/1_1.png',
  '/courses/finance/chapter-1/1_2.png',
  '/courses/finance/chapter-1/1_3.png',
  '/courses/finance/chapter-1/1_4.png',
  '/courses/finance/chapter-1/1_5.png',
  '/courses/finance/chapter-1/1_6.png',
  '/courses/finance/chapter-1/1_7.png',
  '/courses/finance/chapter-1/1_8.png',
  '/courses/finance/chapter-1/1_9.png',
  '/courses/finance/chapter-1/1_10.png',
  '/courses/finance/chapter-1/1_11.png',
  '/courses/finance/chapter-1/1_12.png',
  '/courses/finance/chapter-1/1_13.png',
  '/courses/finance/chapter-1/1_14.png',
  '/courses/finance/chapter-1/1_15.png',
  '/courses/finance/chapter-1/1_16.png',
  '/courses/finance/chapter-1/1_17.png',
  '/courses/finance/chapter-1/1_18.png',
  '/courses/finance/chapter-1/1_19.png',
  '/courses/finance/chapter-1/1_20.png',
  '/courses/finance/chapter-1/1_21.png',
  '/courses/finance/chapter-1/1_22.png',
];

function playCorrectSound() {
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

const slideVariants = {
  enter: (direction: number) => ({ x: direction >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (direction: number) => ({ x: direction >= 0 ? '-100%' : '100%' }),
};

function GapButton({
  selected,
  correct,
  options,
  submitted,
  checkedValue,
  isOpen,
  onSelect,
  onToggle,
}: {
  gapIndex: number;
  selected: string | null;
  correct: string;
  options: string[];
  submitted: boolean;
  checkedValue: string | null | undefined;
  isOpen: boolean;
  onSelect: (v: string) => void;
  onToggle: () => void;
}) {
  const isCorrect = submitted && checkedValue === correct;
  const canEdit = !submitted || !isCorrect;
  const bgClass = !submitted
    ? 'bg-sky-100 border-sky-300 hover:bg-sky-200'
    : isCorrect
      ? 'bg-green-200 border-green-500 text-green-900'
      : 'bg-red-200 border-red-500 text-red-900';

  return (
    <span className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => canEdit && onToggle()}
        className={'inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg border text-lg font-medium transition-colors ' + (canEdit ? 'cursor-pointer ' + bgClass : bgClass)}
      >
        {selected ?? '?'}
      </button>
      {isOpen && (
        <span className="absolute left-0 top-full mt-1 z-20 flex flex-col gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className="px-3 py-2 rounded-lg text-left hover:bg-sky-50 border border-transparent hover:border-sky-200 text-base"
            >
              {opt}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

export default function Chapter1Gallery(props: {
  backUrl: string;
  testUrl?: string;
  onCompleteSlides?: () => void;
}) {
  const { backUrl, testUrl, onCompleteSlides } = props;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [correctAnswerSelected, setCorrectAnswerSelected] = useState(false);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < CHAPTER1_IMAGES.length - 1;
  const isTestSlide = currentIndex === 7; // 8-rasmda: savol va javoblar
  const isTextSlide15 = currentIndex === 14; // 15-rasmda: ta'rif matni
  const isSpecialLayout = isTestSlide || isTextSlide15;

  const [slide15Selected, setSlide15Selected] = useState<(string | null)[]>([null, null, null, null]);
  const [slide15LastChecked, setSlide15LastChecked] = useState<(string | null)[] | null>(null);
  const [slide15OpenDropdown, setSlide15OpenDropdown] = useState<number | null>(null);
  const slide15AllCorrect = slide15LastChecked !== null && slide15LastChecked.every((s, i) => s === CHAPTER1_SLIDE15_GAPS[i].correct);

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  };
  const goNext = () => {
    setDirection(1);
    setCurrentIndex((i) => i + 1);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-100 to-sky-200">
      <Link
        href={backUrl}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white border border-gray-200 shrink-0"
        aria-label="Orqaga"
      >
        <span className="text-xl leading-none">←</span>
      </Link>
      {testUrl ? (
        <Link
          href={testUrl}
          className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md"
          aria-label="Testni boshlash"
        >
          Testni boshlash
        </Link>
      ) : null}

      <div className={'relative w-full ' + (isSpecialLayout ? 'max-w-5xl' : 'max-w-3xl')}>
        {isTextSlide15 ? (
          <div className="flex flex-col md:flex-row-reverse gap-6 md:gap-8 items-center md:items-start">
            <div className="relative w-full md:max-w-xl flex-shrink-0 aspect-[4/3] overflow-hidden md:-mt-28">
              <Image
                src={CHAPTER1_IMAGES[currentIndex]}
                alt="Bo'lim 1"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 576px"
                priority
              />
            </div>
            <div className="w-full md:flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  className="w-12 h-12 shrink-0 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700 border border-sky-200"
                  aria-label={'Ovozni tinglash: ' + CHAPTER1_SLIDE15_TITLE}
                  title="Ovozni tinglash"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <h2 className="text-gray-800 text-2xl font-bold">{CHAPTER1_SLIDE15_TITLE}</h2>
              </div>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="w-10 h-10 shrink-0 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700 border border-sky-200 mt-0.5"
                  aria-label="Ovozni tinglash"
                  title="Ovozni tinglash"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <p className="text-gray-800 text-xl leading-relaxed">
                Moliyaviy savodxonlik - bu pulni{' '}
                <GapButton gapIndex={0} selected={slide15Selected[0]} correct={CHAPTER1_SLIDE15_GAPS[0].correct} options={CHAPTER1_SLIDE15_GAPS[0].options} submitted={slide15LastChecked !== null} checkedValue={slide15LastChecked?.[0]} isOpen={slide15OpenDropdown === 0} onSelect={(v) => { setSlide15Selected((p) => { const n = [...p]; n[0] = v; return n; }); setSlide15OpenDropdown(null); }} onToggle={() => setSlide15OpenDropdown((x) => (x === 0 ? null : 0))} />{' '}
                boshqarish, uning kelib chiqish manbalarini bilish, qanday{' '}
                <GapButton gapIndex={1} selected={slide15Selected[1]} correct={CHAPTER1_SLIDE15_GAPS[1].correct} options={CHAPTER1_SLIDE15_GAPS[1].options} submitted={slide15LastChecked !== null} checkedValue={slide15LastChecked?.[1]} isOpen={slide15OpenDropdown === 1} onSelect={(v) => { setSlide15Selected((p) => { const n = [...p]; n[1] = v; return n; }); setSlide15OpenDropdown(null); }} onToggle={() => setSlide15OpenDropdown((x) => (x === 1 ? null : 1))} />{' '}
                kerakligini tushunish va uni ko&apos;paytirish yo&apos;llarini o&apos;rganish qobiliyatingizdir.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="w-10 h-10 shrink-0 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700 border border-sky-200 mt-0.5"
                  aria-label="Ovozni tinglash"
                  title="Ovozni tinglash"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <p className="text-gray-800 text-xl leading-relaxed">
                Bu{' '}
                <GapButton gapIndex={2} selected={slide15Selected[2]} correct={CHAPTER1_SLIDE15_GAPS[2].correct} options={CHAPTER1_SLIDE15_GAPS[2].options} submitted={slide15LastChecked !== null} checkedValue={slide15LastChecked?.[2]} isOpen={slide15OpenDropdown === 2} onSelect={(v) => { setSlide15Selected((p) => { const n = [...p]; n[2] = v; return n; }); setSlide15OpenDropdown(null); }} onToggle={() => setSlide15OpenDropdown((x) => (x === 2 ? null : 2))} />{' '}
                moliyaviy qarorlar qabul qilish va ular uchun{' '}
                <GapButton gapIndex={3} selected={slide15Selected[3]} correct={CHAPTER1_SLIDE15_GAPS[3].correct} options={CHAPTER1_SLIDE15_GAPS[3].options} submitted={slide15LastChecked !== null} checkedValue={slide15LastChecked?.[3]} isOpen={slide15OpenDropdown === 3} onSelect={(v) => { setSlide15Selected((p) => { const n = [...p]; n[3] = v; return n; }); setSlide15OpenDropdown(null); }} onToggle={() => setSlide15OpenDropdown((x) => (x === 3 ? null : 3))} />{' '}
                o&apos;z zimmangizga olish layoqatidir.
                </p>
              </div>
              {slide15LastChecked !== null && slide15AllCorrect && (
                <p className="text-green-700 text-xl font-bold">To&apos;g&apos;ri!</p>
              )}
              {slide15LastChecked !== null && !slide15AllCorrect && (
                <p className="text-red-600 text-lg font-medium">Noto&apos;g&apos;ri. To&apos;g&apos;ri javoblarni tanlang va Tayyor bosing.</p>
              )}
              {slide15AllCorrect ? (
                <div className="flex justify-end mt-4 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection(1);
                      setCurrentIndex(15);
                    }}
                    className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-800 border border-gray-600 shadow-md shrink-0"
                    aria-label="Keyingi rasm"
                    title="Keyingi rasm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSlide15LastChecked([...slide15Selected]);
                    const allCorrect = slide15Selected.every((s, i) => s === CHAPTER1_SLIDE15_GAPS[i].correct);
                    if (allCorrect) playCorrectSound();
                    else playWrongSound();
                  }}
                  className="mt-4 px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md transition-colors"
                >
                  Tayyor
                </button>
              )}
            </div>
          </div>
        ) : isTestSlide ? (
          <div className="flex flex-col md:flex-row-reverse gap-6 md:gap-8 items-center md:items-start">
            <div className="relative w-full md:max-w-xl flex-shrink-0 aspect-[4/3] overflow-hidden md:-mt-28">
              <Image
                src={CHAPTER1_IMAGES[currentIndex]}
                alt="Bo'lim 1"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 576px"
                priority
              />
            </div>
            <div className="w-full md:flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-12 h-12 shrink-0 rounded-full bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-sky-700 border border-sky-200"
                  aria-label={'Ovozni tinglash: ' + CHAPTER1_QUESTION}
                  title="Ovozni tinglash"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{CHAPTER1_QUESTION}</h2>
              </div>
              <ul className="space-y-3">
                {CHAPTER1_OPTIONS.map((text, i) => {
                  const isCorrectOption = i === CHAPTER1_CORRECT_INDEX;
                  const showGreen = correctAnswerSelected && isCorrectOption;
                  return (
                    <li
                      key={i}
                      role="button"
                      tabIndex={0}
                      className={'flex items-center gap-3 p-3 rounded-2xl border shadow-sm cursor-pointer transition-transform ' + (showGreen ? 'bg-green-100 border-green-500 text-green-900' : 'bg-white/80 border-gray-200/80 hover:bg-white/90 active:scale-[0.99]')}
                      onClick={() => {
                        if (isCorrectOption) {
                          playCorrectSound();
                          setCorrectAnswerSelected(true);
                        } else {
                          playWrongSound();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (isCorrectOption) {
                            playCorrectSound();
                            setCorrectAnswerSelected(true);
                          } else {
                            playWrongSound();
                          }
                        }
                      }}
                    >
                      <button
                        type="button"
                        className={'w-10 h-10 shrink-0 rounded-full flex items-center justify-center border ' + (showGreen ? 'bg-green-200 border-green-400 text-green-800' : 'bg-sky-100 hover:bg-sky-200 text-sky-700 border-sky-200')}
                        aria-label={'Ovozni tinglash: ' + text}
                        title="Ovozni tinglash"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      </button>
                      <span className={'font-medium text-lg ' + (showGreen ? 'text-green-900' : 'text-gray-800')}>{text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}
        {isTestSlide && correctAnswerSelected ? (
          <div className="flex items-center justify-end mt-4 w-full max-w-5xl">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDirection(1);
                setCurrentIndex(8);
              }}
              className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-800 border border-gray-600 shadow-md shrink-0"
              aria-label="Keyingi rasm"
              title="Keyingi rasm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : null}
        {!isSpecialLayout ? (
          <>
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <AnimatePresence initial={false} mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <Image
                    src={CHAPTER1_IMAGES[currentIndex]}
                    alt={'Bo\'lim 1 — ' + (currentIndex + 1)}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 768px"
                    priority={currentIndex === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between mt-3 px-2 w-full">
              <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                {hasPrev ? (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-md"
                    aria-label="Oldingi rasm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                ) : null}
              </div>
              <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                {hasNext ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-800 border border-gray-600 shadow-md"
                    aria-label="Keyingi rasm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
            {currentIndex === CHAPTER1_IMAGES.length - 1 && (
              <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
                {testUrl ? (
                  <Link
                    href={testUrl}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-md transition-colors"
                    aria-label="Testni boshlash"
                  >
                    Testni boshlash
                  </Link>
                ) : null}
                {onCompleteSlides ? (
                  <button
                    type="button"
                    onClick={onCompleteSlides}
                    className="px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md transition-colors"
                    aria-label="Bo'limni tugatish"
                  >
                    Bo&apos;limni tugatish
                  </button>
                ) : (
                  <Link
                    href={backUrl}
                    className="px-6 py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md transition-colors"
                    aria-label="Bo'limni tugatish"
                  >
                    Bo&apos;limni tugatish
                  </Link>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
