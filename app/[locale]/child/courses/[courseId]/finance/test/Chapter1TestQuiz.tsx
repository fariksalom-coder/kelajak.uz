'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';

const CHAPTER1_QUESTIONS: { question: string; options: string[]; correctIndex: number }[] = [
  {
    question: "Moliyaviy savodxonlik nimani anglatadi?",
    options: ["Yo'l topishni", "Pul bilan to'g'ri muomala qilishni", "Tez yugurishni"],
    correctIndex: 1,
  },
  {
    question: "Qiz maktabda nimani o'rgangan?",
    options: ["Rasm chizishni", "Pulni jamg'arishni", "Qo'shiq aytishni"],
    correctIndex: 1,
  },
  {
    question: "Moliyaviy savodxonlik bolaga nimaga yordam beradi?",
    options: ["Ko'proq o'yin o'ynashga", "Pulni bekorga sarflamaslikka", "Ko'proq uxlab olishga"],
    correctIndex: 1,
  },
  {
    question: "Moliyaviy savodxon bola nima qila oladi?",
    options: ["Pulini rejalashtira oladi", "Pulni darrov sarflaydi", "Pulni yo'qotadi"],
    correctIndex: 0,
  },
  {
    question: "Nega qiz burgerga bormadi?",
    options: ["Burger yo'q edi", "Pulni bekorga sarflashni xohlamadi", "U ovqat yemaydi"],
    correctIndex: 1,
  },
  {
    question: "Moliyaviy savodxonlik yana nimaga yordam beradi?",
    options: ["Orzuga pul yig'ishga", "Doim xarid qilishga", "Pulni yashirishga"],
    correctIndex: 0,
  },
  {
    question: "Pulni to'g'ri ishlatsang nima bo'lishi mumkin?",
    options: ["Pul kamayadi", "Pul ko'payishi mumkin", "Hech narsa bo'lmaydi"],
    correctIndex: 1,
  },
  {
    question: "Qizning dugonasi kvadrokopterni qanday olgan?",
    options: ["Sovg'a qilishgan", "Jamg'arib olgan", "Topib olgan"],
    correctIndex: 1,
  },
  {
    question: "Moliyaviy savodxonlik nimani o'rgatadi?",
    options: ["Pul qayerdan kelishini tushunishni", "Pulni tashlab yuborishni", "Pulni sanamaslikni"],
    correctIndex: 0,
  },
  {
    question: "Moliyaviy savodxon bola qanday bo'ladi?",
    options: ["Mustaqilroq bo'ladi", "Hammasini boshqalardan so'raydi", "Pulni yo'qotadi"],
    correctIndex: 0,
  },
];

const TOTAL_QUESTIONS = CHAPTER1_QUESTIONS.length;
const PASS_THRESHOLD = 8;

export default function Chapter1TestQuiz({
  backUrl,
  onComplete,
}: {
  backUrl: string;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
  const [finished, setFinished] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [optionPlayingIndex, setOptionPlayingIndex] = useState<number | null>(null);

  const currentQuestion = CHAPTER1_QUESTIONS[step];

  const playQuestionAudio = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setOptionPlayingIndex(null);
    const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.9;
    utterance.onstart = () => setAudioPlaying(true);
    utterance.onend = () => setAudioPlaying(false);
    utterance.onerror = () => setAudioPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [currentQuestion.question]);

  const playOptionAudio = useCallback((text: string, index: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setAudioPlaying(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ';
    utterance.rate = 0.9;
    utterance.onstart = () => setOptionPlayingIndex(index);
    utterance.onend = () => setOptionPlayingIndex(null);
    utterance.onerror = () => setOptionPlayingIndex(null);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setAudioPlaying(false);
      setOptionPlayingIndex(null);
    }
  }, [step]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  const selectedAnswer = answers[step];
  const isLastQuestion = step === TOTAL_QUESTIONS - 1;

  const correctCount = answers.reduce((sum, a, i) => sum + (a === CHAPTER1_QUESTIONS[i].correctIndex ? 1 : 0), 0);
  const passed = finished && correctCount >= PASS_THRESHOLD;

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setFinished(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers(Array(TOTAL_QUESTIONS).fill(null));
    setFinished(false);
  };

  if (finished) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-100 to-sky-200">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">
            Natija: {correctCount}/{TOTAL_QUESTIONS}
          </p>
          {passed ? (
            <>
              <p className="text-xl text-green-700 font-semibold mb-6">
                Tabriklaymiz! Siz testdan o&apos;tdingiz 🎉
              </p>
              {onComplete ? (
                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full py-4 px-6 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md"
                >
                  Davom etish
                </button>
              ) : (
                <Link
                  href={backUrl}
                  className="inline-block w-full py-4 px-6 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-md"
                >
                  Davom etish
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="text-xl text-red-600 font-semibold mb-2">
                Siz testdan o&apos;ta olmadingiz.
              </p>
              <p className="text-gray-700 mb-6">Iltimos, testni qayta ishlang.</p>
              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-md"
              >
                Testni qayta boshlash
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-sky-100 to-sky-200">
      <Link
        href={backUrl}
        className="self-start w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 border border-gray-200 shadow mb-4"
        aria-label="Orqaga"
      >
        <span className="text-xl leading-none">←</span>
      </Link>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <p className="text-lg font-semibold text-gray-700 mb-6">
          Savol {step + 1} / {TOTAL_QUESTIONS}
        </p>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 flex-1 flex flex-col">
          <div className="flex items-start gap-3 mb-6">
            <button
              type="button"
              onClick={playQuestionAudio}
              className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                audioPlaying
                  ? 'bg-sky-500 border-sky-600 text-white'
                  : 'bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100 hover:border-sky-300'
              }`}
              aria-label="Savolni tinglash"
              title="Savolni tinglash"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                {audioPlaying ? (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                ) : (
                  <>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </>
                )}
              </svg>
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug pt-2">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-4 flex-1">
            {currentQuestion.options.map((option, idx) => (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(idx);
                  }
                }}
                className={`w-full text-left py-4 px-5 rounded-2xl border-2 text-lg font-medium transition-all flex items-center gap-3 cursor-pointer ${
                  selectedAnswer === idx
                    ? 'border-sky-500 bg-sky-50 text-sky-900'
                    : 'border-gray-200 bg-gray-50 hover:border-sky-300 hover:bg-sky-50/50 text-gray-800'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    playOptionAudio(option, idx);
                  }}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                    optionPlayingIndex === idx
                      ? 'bg-sky-500 border-sky-600 text-white'
                      : 'bg-sky-50/80 border-sky-200 text-sky-600 hover:bg-sky-100 hover:border-sky-300'
                  }`}
                  aria-label={`Variantni tinglash: ${option}`}
                  title="Tinglash"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    {optionPlayingIndex === idx ? (
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    ) : (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    )}
                  </svg>
                </button>
                <span className="flex-1">{option}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={selectedAnswer === null}
            className="mt-8 w-full py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg shadow-md"
          >
            Keyingi savol
          </button>
        </div>
      </div>
    </main>
  );
}
