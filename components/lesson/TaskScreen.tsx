'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import CharacterAvatar from '@/components/lesson/CharacterAvatar';

const HP_PER_STAGE = 10;

export type TaskScreenProps = {
  onBack: () => void;
  /** Asosiy rasm papkasi, masalan: /courses/math-1grade/1-raqamlar-va-miqdorlar/1-kosmik-sarguzasht */
  imageBaseUrl: string;
  /** Saqlash uchun: barcha bosqichlar tugagach XP ni API orqali yozamiz */
  childId?: string;
  courseId?: string;
  lessonSlug?: string;
  /** Tugatilganda chaqiriladi (masalan, kartochkada galochka va keyingisi ochilishi uchun) */
  onComplete?: () => void;
  /** Sayyorani tadqiq qil — xuddi Boshlash kabi fon, orqaga, progress bar, kontent keyinroq */
  /** Tartib bilan sanaymiz — faqat fon va progress bar, etaplar yo'q */
  lessonVariant?: 'boshlash' | 'sayyorani' | 'raketani-tuzat' | 'tartib-bilan' | 'buyumlarni-next' | 'block3-task1' | 'block3-task2' | 'block4-task1' | 'ali-nechanchi-uy' | 'katak-qogoz' | 'raqam-yozish';
  /** Block 3 task 1: etap (0 yoki 1). Parent da saqlansa, qayta mount da yo'qolmaydi */
  block3Task1Stage?: number;
  onBlock3Task1StageChange?: (stage: number) => void;
};

const STAGES = [
  { sweetsImage: 'shirinlik1.png', answerOptions: [3, 2, 5], correctIndex: 0 },
  { sweetsImage: 'shirinlik2.png', answerOptions: [4, 5, 6], correctIndex: 1 },
  { words: ['YETTI', 'UCH', 'OLTI'], answerOptions: [7, 3, 6], correctIndex: 0 },
  { words: ['IKKI', 'UCH', 'BESH'], answerOptions: [2, 3, 5], correctIndex: 2, buttonTriples: [[2, 1, 5], [5, 3, 4], [2, 3, 5]] as const },
  { words: ["TO'RT", 'OLTI', 'SAKKIZ'], answerOptions: [4, 6, 8], correctIndex: 2, buttonTriples: [[4, 2, 9], [1, 6, 7], [4, 6, 8]] as const },
  { layout: 'starStone', answerOptions: [0, 1], correctIndex: 0 }, // 6-etap: yuqoridagi yulduzni tanlang
  { layout: 'starStone', answerOptions: [0, 1], correctIndex: 1 }, // 7-etap: quyidagi yulduzni tanlang (vertical)
  { layout: 'starStone', answerOptions: [0, 1], correctIndex: 1 }, // 8-etap: o'ngdagi yulduzni tanlang
  { layout: 'starStone', answerOptions: [0, 1], correctIndex: 0 }, // 9-etap: chapdagi yulduzni tanlang
  { layout: 'starStoneMiddle', answerOptions: [0, 1], correctIndex: 0 }, // 10-etap: o'rtadagi yulduzni tanlang (2 tosh, 2 yulduz: o'rta, past)
  { layout: 'shapes', answerOptions: [0, 1, 2, 3], correctIndex: 0 }, // 11-etap: kvadratni tanlang (yuqorida)
  { layout: 'shapes', answerOptions: [0, 1, 2, 3], correctIndex: 3, shapes: ['pentagon', 'rhombus', 'parallelogram', 'triangle'] }, // 12-etap: uchburchakni tanlang (pastda)
] as const;

type StageConfig = (typeof STAGES)[number];
function isWordsStage(s: StageConfig): s is StageConfig & { words: readonly string[] } {
  return 'words' in s && Array.isArray((s as { words?: unknown }).words);
}
function hasButtonTriples(s: StageConfig): s is StageConfig & { buttonTriples: readonly (readonly number[])[] } {
  return 'buttonTriples' in s && Array.isArray((s as { buttonTriples?: unknown }).buttonTriples);
}
function isStarStoneStage(s: StageConfig): s is StageConfig & { layout: 'starStone' } {
  return 'layout' in s && (s as { layout?: string }).layout === 'starStone';
}
function isStarStoneMiddleStage(s: StageConfig): s is StageConfig & { layout: 'starStoneMiddle' } {
  return 'layout' in s && (s as { layout?: string }).layout === 'starStoneMiddle';
}
function isShapesStage(s: StageConfig): s is StageConfig & { layout: 'shapes' } {
  return 'layout' in s && (s as { layout?: string }).layout === 'shapes';
}

const SHAPE_SVG: Record<string, JSX.Element> = {
  square: (
    <svg viewBox="0 0 80 80" className="w-full h-full p-3" fill="none" stroke="#ea580c" strokeWidth="3">
      <rect x="15" y="15" width="50" height="50" fill="#facc15" />
    </svg>
  ),
  parallelogram: (
    <svg viewBox="0 0 80 80" className="w-full h-full p-3" fill="none" stroke="#ea580c" strokeWidth="3">
      <path d="M25 15 L65 15 L55 65 L15 65 Z" fill="#facc15" />
    </svg>
  ),
  pentagon: (
    <svg viewBox="0 0 80 80" className="w-full h-full p-3" fill="none" stroke="#ea580c" strokeWidth="3">
      <path d="M40 12 L72 32 L60 68 L20 68 L8 32 Z" fill="#facc15" />
    </svg>
  ),
  rhombus: (
    <svg viewBox="0 0 80 80" className="w-full h-full p-3" fill="none" stroke="#ea580c" strokeWidth="3">
      <path d="M40 10 L70 40 L40 70 L10 40 Z" fill="#facc15" />
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 80 80" className="w-full h-full p-3" fill="none" stroke="#ea580c" strokeWidth="3">
      <path d="M40 12 L72 68 L8 68 Z" fill="#facc15" />
    </svg>
  ),
};

function ShapeButton({
  index,
  correctIndex,
  wrongIndices,
  correctSelected,
  onAnswer,
  shape,
}: {
  index: number;
  correctIndex: number;
  wrongIndices: Set<number>;
  correctSelected: boolean;
  onAnswer: (i: number) => void;
  shape: keyof typeof SHAPE_SVG;
}) {
  const isWrong = wrongIndices.has(index) || (correctSelected && index !== correctIndex);
  const isCorrect = correctSelected && index === correctIndex;
  return (
    <button
      type="button"
      onClick={() => onAnswer(index)}
      disabled={wrongIndices.has(index) || correctSelected}
      className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 bg-blue-900/90 border-2 border-amber-500 shadow-lg ${
        isWrong ? 'opacity-50' : isCorrect ? 'scale-110 ring-2 ring-amber-400' : 'hover:scale-105 active:scale-95'
      }`}
    >
      {SHAPE_SVG[shape]}
    </button>
  );
}

export default function TaskScreen({ onBack, imageBaseUrl, childId, courseId, lessonSlug, onComplete, lessonVariant = 'boshlash', block3Task1Stage: block3StageProp, onBlock3Task1StageChange }: TaskScreenProps) {
  const fonSrc = `${imageBaseUrl}/fon.png`;
  const ramkaSrc = `${imageBaseUrl}/ramka.png`;
  const isTartibBilan = lessonVariant === 'tartib-bilan';
  const isBuyumlarniNext = lessonVariant === 'buyumlarni-next';
  const isBlock3Task1 = lessonVariant === 'block3-task1';
  const isBlock3Task2 = lessonVariant === 'block3-task2';
  const isBlock4Task1 = lessonVariant === 'block4-task1';
  const [block3StageLocal, setBlock3StageLocal] = useState(0);
  const block3Stage = onBlock3Task1StageChange != null && block3StageProp !== undefined ? block3StageProp : block3StageLocal;
  const setBlock3Stage = useMemo(
    () =>
      onBlock3Task1StageChange
        ? (s: number | ((prev: number) => number)) => {
            const v = typeof s === 'function' ? s(block3StageProp ?? 0) : s;
            onBlock3Task1StageChange(v);
          }
        : setBlock3StageLocal,
    [onBlock3Task1StageChange, block3StageProp]
  );
  const [block3Answer, setBlock3Answer] = useState('');
  const [block3QuizShowNext, setBlock3QuizShowNext] = useState(false);
  const [block3ShowCongrats, setBlock3ShowCongrats] = useState(false);
  const [block3Task2Selected, setBlock3Task2Selected] = useState<number | null>(null);
  const [block3Task2Stage, setBlock3Task2Stage] = useState(0);
  const [block3Task2Stage1Selected, setBlock3Task2Stage1Selected] = useState<number | null>(null);
  const [block3Task2ShowCongrats, setBlock3Task2ShowCongrats] = useState(false);
  const block3Task2Stage1OptionsRef = useRef<{ stage: number; options: number[] } | null>(null);
  const block3AliOrderRef = useRef<Record<number, number[]>>({});
  const [isShortHeight, setIsShortHeight] = useState(false);
  const [contentScale, setContentScale] = useState(1);
  useEffect(() => {
    const mql = window.matchMedia('(max-height: 520px)');
    const update = () => {
      setIsShortHeight(mql.matches);
      setContentScale(Math.min(1, window.innerHeight / 600));
    };
    update();
    mql.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      mql.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  useEffect(() => {
    if (!isBlock3Task2 || block3Task2Stage !== 0 || block3Task2Selected !== 6) return;
    const t = setTimeout(() => {
      block3Task2Stage1OptionsRef.current = null;
      setBlock3Task2Stage(1);
    }, 1500);
    return () => clearTimeout(t);
  }, [isBlock3Task2, block3Task2Stage, block3Task2Selected]);
  useEffect(() => {
    if (!isBlock3Task2 || block3Task2Stage < 1 || block3Task2Stage > 6) return;
    const correctOrdinalIndex = block3Task2Stage - 1;
    if (block3Task2Stage1Selected !== correctOrdinalIndex) return;
    const t = setTimeout(() => {
      if (block3Task2Stage === 6) {
        setBlock3Task2ShowCongrats(true);
      } else {
        block3Task2Stage1OptionsRef.current = null;
        setBlock3Task2Stage1Selected(null);
        setBlock3Task2Stage((s) => s + 1);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [isBlock3Task2, block3Task2Stage, block3Task2Stage1Selected]);
  useEffect(() => {
    if (isBlock3Task1 && (block3Stage < 2 || block3Stage > 9)) {
      setBlock3QuizShowNext(false);
      setBlock3ShowCongrats(false);
      if (block3Stage < 6 || block3Stage > 9) block3AliOrderRef.current = {};
    }
  }, [isBlock3Task1, block3Stage]);
  useEffect(() => {
    if (!isBlock3Task1 || !block3QuizShowNext || block3Stage < 2 || block3Stage > 9) return;
    const t = setTimeout(() => {
      setBlock3QuizShowNext(false);
      if (block3Stage === 9) {
        setBlock3ShowCongrats(true);
      } else {
        setBlock3Stage(block3Stage + 1);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [isBlock3Task1, block3QuizShowNext, block3Stage, setBlock3Stage]);
  const block3CharPositions = useMemo(() => {
    const chars = ['Lola', 'Akram', 'Ali', 'Soliha'] as const;
    const pos = [
      { left: '5%', top: '8%' },
      { left: '38%', top: '55%' },
      { left: '68%', top: '12%' },
      { left: '88%', top: '50%' },
    ];
    const shuffled = [...pos].sort(() => Math.random() - 0.5);
    return chars.map((name, i) => ({ name, ...shuffled[i] }));
  }, []);
  const isAliNechanchiUy = lessonVariant === 'ali-nechanchi-uy';
  const isKatakQogoz = lessonVariant === 'katak-qogoz';
  const isRaqamYozish = lessonVariant === 'raqam-yozish';
  const isSayyorani = lessonVariant === 'sayyorani';
  const isRaketaniTuzat = lessonVariant === 'raketani-tuzat';
  // Raketani tuzat: boshlang'ich ekran allaqachon math_1grade da ko'rsatiladi, shuning uchun ikkinchi marta Boshlash kerak emas
  const [raketaniIntroStarted, setRaketaniIntroStarted] = useState(lessonVariant === 'raketani-tuzat');
  const [raketaniTaskComplete, setRaketaniTaskComplete] = useState(false);
  const [raketaniWrongBox, setRaketaniWrongBox] = useState<number | null>(null);
  const [raketaniBoxCorrect, setRaketaniBoxCorrect] = useState(false);
  const [raketaniStage, setRaketaniStage] = useState(0); // 0:3 1:6 2:9 | 3:2 4:4 5:8 | 6:ko'proq 7:kamroq
  // 0–5: 5 quti (topish: 3,6,9,2,4,8); 6–7: 2 quti (ko'proq / kamroq)
  const raketaniAppleCounts = useMemo(() => {
    if (raketaniStage === 0) {
      const counts = [1, 2, 3, 4, 5];
      for (let i = counts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [counts[i], counts[j]] = [counts[j], counts[i]];
      }
      return counts;
    }
    const makeFiveWithTarget = (target: number) => {
      const rest = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== target);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const counts = [target, rest[0], rest[1], rest[2], rest[3]];
      for (let i = counts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [counts[i], counts[j]] = [counts[j], counts[i]];
      }
      return counts;
    };
    if (raketaniStage === 1) return makeFiveWithTarget(6);
    if (raketaniStage === 2) return makeFiveWithTarget(9);
    if (raketaniStage === 3) return makeFiveWithTarget(2);
    if (raketaniStage === 4) return makeFiveWithTarget(4);
    if (raketaniStage === 5) return makeFiveWithTarget(8);
    // 6–7: 2 ta quti — ko'proq / kamroq
    const less = Math.floor(Math.random() * 6) + 1;
    const more = Math.floor(Math.random() * (9 - less)) + less + 1;
    const counts = Math.random() < 0.5 ? [less, more] : [more, less];
    return counts;
  }, [raketaniStage]);
  const raketaniTarget = raketaniStage <= 5 ? [3, 6, 9, 2, 4, 8][raketaniStage] : null;
  const raketaniCorrectBoxIndex = raketaniTarget !== null
    ? raketaniAppleCounts.indexOf(raketaniTarget)
    : (raketaniStage === 6 || raketaniStage === 8)
      ? (raketaniAppleCounts[0] >= raketaniAppleCounts[1] ? 0 : 1) // ko'proq
      : (raketaniAppleCounts[0] <= raketaniAppleCounts[1] ? 0 : 1); // kamroq
  const raketaniPrompt = [
    'Qaysi qutida UCHTA olma bor?',
    'Qaysi qutida OLTI ta olma bor?',
    "Qaysi qutida TO'QQIZ ta olma bor?",
    'Qaysi qutida IKKI ta olma bor?',
    "Qaysi qutida TO'RT ta olma bor?",
    "Qaysi qutida SAKKIZ ta olma bor?",
    "Qaysida ko'proq olma bor?",
    "Qaysida kamroq olma bor?",
    "Qaysida ko'proq olma bor?",
    "Qaysida kamroq olma bor?",
  ][raketaniStage];
  const raketaniBoxCount = raketaniStage >= 6 ? 2 : 5;
  const raketaniStartAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPressed, setAudioPressed] = useState(false);
  const [stage, setStage] = useState(0);
  const wrongTriplesStage3 = useMemo(() => {
    const correct = [7, 3, 6];
    const pick = () => Math.floor(Math.random() * 10) + 1;
    const makeTriple = (): number[] => [pick(), pick(), pick()];
    const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
    let a = makeTriple();
    while (same(a, correct)) a = makeTriple();
    let b = makeTriple();
    while (same(b, correct) || same(b, a)) b = makeTriple();
    return [a, b];
  }, []);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [correctSelected, setCorrectSelected] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [sayyoraniStage, setSayyoraniStage] = useState(0);
  const [sortOrder, setSortOrder] = useState<number[]>([0, 1, 2, 3]);
  const [sortSelectedSlot, setSortSelectedSlot] = useState<number | null>(null);
  const [swapAnimation, setSwapAnimation] = useState<{ from: number; to: number; fromLeft: number; fromTop: number; toLeft: number; toTop: number } | null>(null);
  const [swapAnimating, setSwapAnimating] = useState(false);
  const sortSlotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [sayyoraniComplete, setSayyoraniComplete] = useState(false);
  const sayyoraniResultSavedRef = useRef(false);
  const sayyoraniEndSoundPlayedRef = useRef(false);
  const resultSavedRef = useRef(false);
  // Tartib bilan: etap 0 — 1–8, etap 1 — 1–5, etap 2 — 4,8 подписаны, этап 3 — «найди 3-й домик»
  const [tartibBilanStage, setTartibBilanStage] = useState(0);
  const [tartibBilanValues, setTartibBilanValues] = useState<string[]>(() => Array(8).fill(''));
  const [tartibBilanStage3Complete, setTartibBilanStage3Complete] = useState(false);
  const [tartibBilanStage4Complete, setTartibBilanStage4Complete] = useState(false);
  const [tartibBilanStage5Complete, setTartibBilanStage5Complete] = useState(false);
  const [tartibBilanStage6Complete, setTartibBilanStage6Complete] = useState(false);
  const [tartibBilanStage7Found, setTartibBilanStage7Found] = useState<number[]>([]); // 1 va 5-uyni toping: 0 va 4
  const [tartibBilanStage7Complete, setTartibBilanStage7Complete] = useState(false);
  const [aliUyAnswer, setAliUyAnswer] = useState('');
  const [aliUyStage, setAliUyStage] = useState(1); // 1 = Ali uy 2 … 8 = Ali uy 4 (oxirgi)
  const [aliUyShowFinalScreen, setAliUyShowFinalScreen] = useState(false);
  const [raqamYozishStage, setRaqamYozishStage] = useState(0); // 0 = intro (Katak qog'oz), 1..10 = raqamlar 1,2,...,9,0
  const [raqamYozishShowBarakalla, setRaqamYozishShowBarakalla] = useState(false);
  const [raqamYozishShowFinalScreen, setRaqamYozishShowFinalScreen] = useState(false);

  const allComplete = completedSteps >= STAGES.length;
  const totalXp = STAGES.length * HP_PER_STAGE;
  const endSoundPlayedRef = useRef(false);

  useEffect(() => {
    if (!allComplete) return;
    if (endSoundPlayedRef.current) return;
    endSoundPlayedRef.current = true;
    try {
      const audio = new Audio(`${imageBaseUrl}/end.mp3`);
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, [allComplete, imageBaseUrl]);

  useEffect(() => {
    if (!allComplete || resultSavedRef.current) return;
    if (!childId || !courseId || !lessonSlug) return;
    resultSavedRef.current = true;
    fetch(`/api/child/${childId}/lesson-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, lessonSlug, xp: totalXp }),
    })
      .then((r) => { if (r.ok) onComplete?.(); })
      .catch(() => {});
  }, [allComplete, childId, courseId, lessonSlug, totalXp, onComplete]);

  const handleAudioClick = () => {
    setAudioPressed(true);
    setTimeout(() => setAudioPressed(false), 300);
  };

  type SayyoraniSquaresStage = { type: 'squares'; squares: (number | string)[]; options: number[]; correctIndex: number };
  type SayyoraniFindNumberStage = { type: 'findNumber'; numbers: number[]; correct: number; label: string };
  type SayyoraniCountPeopleStage = { type: 'countPeople'; heroes: string[]; label: string; correctIndex: number };
  type SayyoraniChooseTallerStage = { type: 'chooseTaller'; heroes: string[]; label: string; correctIndex: number };
  type SayyoraniSortOrderStage = { type: 'sortOrder'; imageKeys: string[]; label: string };
  type SayyoraniStage = SayyoraniSquaresStage | SayyoraniFindNumberStage | SayyoraniCountPeopleStage | SayyoraniChooseTallerStage | SayyoraniSortOrderStage;
  const SAYYORANI_STAGES: SayyoraniStage[] = [
    { type: 'squares', squares: [1, 2, '?', 4, 5], options: [4, 3, 7], correctIndex: 1 }, // 3
    { type: 'squares', squares: [1, 2, 3, '?', 5], options: [2, 4, 6], correctIndex: 1 }, // 4
    { type: 'squares', squares: [4, 5, 6, 7, '?'], options: [9, 6, 8], correctIndex: 2 }, // 8
    { type: 'findNumber', numbers: [1, 3, 6, 7], correct: 7, label: 'YETTI raqamini toping' },
    { type: 'findNumber', numbers: [1, 3, 6, 7], correct: 3, label: 'UCH raqamini toping' },
    { type: 'findNumber', numbers: [1, 3, 5, 7], correct: 5, label: 'BESH raqamini toping' },
    { type: 'countPeople', heroes: ['lola', 'akram', 'ali', 'soliha'], label: "Ekranda nechta odamni ko'ryapsan? Sonni tanla", correctIndex: 3 }, // 4 odam → 4 (index 3)
    { type: 'countPeople', heroes: ['ali', 'lola'], label: "Ekranda nechta odamni ko'ryapsan? Sonni tanla", correctIndex: 1 }, // 2 odam → 2 (index 1)
    { type: 'chooseTaller', heroes: ['lola', 'soliha', 'akram'], label: 'Eng baland odamni tanla', correctIndex: 0 }, // Lola — 20% katta; Soliha va Akram bir xil
    { type: 'chooseTaller', heroes: ['lola', 'soliha', 'akram'], label: 'Eng baland odamni tanla', correctIndex: 2 }, // Akram — 20% katta, o‘ngda
    { type: 'sortOrder', imageKeys: ['fish_1', 'fish_2', 'fish_3', 'fish_4'], label: "Baliqni to'g'ri ter" },
  ];
  const sayyoraniData = SAYYORANI_STAGES[sayyoraniStage] ?? SAYYORANI_STAGES[0];
  const isSayyoraniFindNumber = sayyoraniData.type === 'findNumber';
  const isSayyoraniCountPeople = sayyoraniData.type === 'countPeople';
  const isSayyoraniChooseTaller = sayyoraniData.type === 'chooseTaller';
  const isSayyoraniSortOrder = sayyoraniData.type === 'sortOrder';

  useEffect(() => {
    if (isSayyoraniSortOrder && sayyoraniData.type === 'sortOrder') {
      const a = [0, 1, 2, 3];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      setSortOrder(a);
      setSortSelectedSlot(null);
      setSwapAnimation(null);
      setSwapAnimating(false);
    }
  }, [sayyoraniStage, isSayyoraniSortOrder, sayyoraniData.type]);
  const sayyoraniFindNumberNumbers = isSayyoraniFindNumber ? (sayyoraniData as SayyoraniFindNumberStage).numbers : null;
  const sayyoraniFindNumberOrder = useMemo(() => {
    if (!isSayyoraniFindNumber || !sayyoraniFindNumberNumbers) return [];
    const arr = [...sayyoraniFindNumberNumbers];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [isSayyoraniFindNumber, sayyoraniFindNumberNumbers]);
  const sayyoraniOptions = sayyoraniData.type === 'squares' ? sayyoraniData.options : [];
  const sayyoraniCorrectIndex =
    sayyoraniData.type === 'squares'
      ? sayyoraniData.correctIndex
      : sayyoraniData.type === 'countPeople' || sayyoraniData.type === 'chooseTaller'
        ? sayyoraniData.correctIndex
        : sayyoraniData.type === 'sortOrder'
          ? 0
          : sayyoraniFindNumberOrder.indexOf(sayyoraniData.correct);
  const sayyoraniProgress = (sayyoraniStage + (correctSelected ? 1 : 0)) / SAYYORANI_STAGES.length;
  const playSayyoraniCorrect = () => {
    try {
      new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
    } catch {
      // ignore
    }
  };
  const playSayyoraniWrong = () => {
    try {
      new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
    } catch {
      // ignore
    }
  };
  const handleSayyoraniAnswer = (index: number) => {
    if (index === sayyoraniCorrectIndex) {
      setCorrectSelected(true);
      playSayyoraniCorrect();
      const isLastSayyorani = sayyoraniStage === SAYYORANI_STAGES.length - 1;
      if (isLastSayyorani) {
        setTimeout(() => setSayyoraniComplete(true), 2500);
      } else {
        setTimeout(() => {
          setSayyoraniStage((s) => s + 1);
          setWrongIndices(new Set());
          setCorrectSelected(false);
        }, 500);
      }
    } else {
      setWrongIndices((prev) => new Set(prev).add(index));
      playSayyoraniWrong();
    }
  };

  const handleSortSlotClick = (slotIndex: number) => {
    if (sayyoraniData.type !== 'sortOrder' || correctSelected || swapAnimation) return;
    if (sortSelectedSlot === null) {
      setSortSelectedSlot(slotIndex);
      return;
    }
    if (sortSelectedSlot === slotIndex) {
      setSortSelectedSlot(null);
      return;
    }
    const from = sortSelectedSlot;
    const to = slotIndex;
    const fromEl = sortSlotRefs.current[from];
    const toEl = sortSlotRefs.current[to];
    if (!fromEl || !toEl) {
      setSortOrder((prev) => {
        const next = [...prev];
        [next[from], next[to]] = [next[to], next[from]];
        return next;
      });
      setSortSelectedSlot(null);
      return;
    }
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    setSortOrder((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
    setSortSelectedSlot(null);
    setSwapAnimation({ from, to, fromLeft: fromRect.left, fromTop: fromRect.top, toLeft: toRect.left, toTop: toRect.top });
    setSwapAnimating(false);
  };

  useEffect(() => {
    if (!swapAnimation || swapAnimating) return;
    const id = requestAnimationFrame(() => setSwapAnimating(true));
    return () => cancelAnimationFrame(id);
  }, [swapAnimation, swapAnimating]);

  const handleSwapTransitionEnd = () => {
    setSwapAnimation(null);
    setSwapAnimating(false);
  };

  const handleSortOrderReady = () => {
    if (sayyoraniData.type !== 'sortOrder' || correctSelected) return;
    const correct = sortOrder.length === 4 && sortOrder.every((v, i) => v === i);
    if (correct) {
      setCorrectSelected(true);
      playSayyoraniCorrect();
      const isLastSayyorani = sayyoraniStage === SAYYORANI_STAGES.length - 1;
      if (isLastSayyorani) {
        setTimeout(() => setSayyoraniComplete(true), 2500);
      } else {
        setTimeout(() => {
          setSayyoraniStage((s) => s + 1);
          setWrongIndices(new Set());
          setCorrectSelected(false);
        }, 500);
      }
    } else {
      playSayyoraniWrong();
    }
  };

  const sayyoraniXp = SAYYORANI_STAGES.length * HP_PER_STAGE;

  useEffect(() => {
    if (!isSayyorani || !sayyoraniComplete || sayyoraniEndSoundPlayedRef.current) return;
    sayyoraniEndSoundPlayedRef.current = true;
    try {
      new Audio(`${imageBaseUrl}/end.mp3`).play().catch(() => {});
    } catch {
      // ignore
    }
  }, [isSayyorani, sayyoraniComplete, imageBaseUrl]);

  // Raketani tuzat: intro ekranda start.mp3
  useEffect(() => {
    if (!isRaketaniTuzat || raketaniIntroStarted) return;
    const audio = new Audio(`${imageBaseUrl}/start.mp3`);
    audio.volume = 0.7;
    audio.loop = true;
    audio.play().catch(() => {});
    raketaniStartAudioRef.current = audio;
    return () => {
      audio.pause();
      raketaniStartAudioRef.current = null;
    };
  }, [isRaketaniTuzat, raketaniIntroStarted, imageBaseUrl]);

  useEffect(() => {
    if (!isSayyorani || !sayyoraniComplete || sayyoraniResultSavedRef.current) return;
    if (!childId || !courseId || !lessonSlug) return;
    sayyoraniResultSavedRef.current = true;
    fetch(`/api/child/${childId}/lesson-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, lessonSlug, xp: sayyoraniXp }),
    }).catch(() => {});
  }, [isSayyorani, sayyoraniComplete, childId, courseId, lessonSlug, sayyoraniXp]);

  // Tartib bilan sanaymiz: faqat fon va progress bar, etaplar yo'q (fon4.png)
  if (isTartibBilan) {
    const isStage1 = tartibBilanStage === 1;
    const isStage2 = tartibBilanStage === 2;
    const isStage3 = tartibBilanStage === 3;
    const isStage4 = tartibBilanStage === 4;
    const isStage5 = tartibBilanStage === 5;
    const isStage6 = tartibBilanStage === 6;
    const isStage7 = tartibBilanStage === 7;
    const TARTIB_EDITABLE_STAGE2 = [0, 1, 2, 4, 5, 6]; // 4 и 8 домики подписаны
    const TARTIB_STAGE7_CORRECT_INDICES = [0, 4]; // 1-й и 5-й домик
    const TARTIB_FIND_CORRECT_INDEX = isStage6 ? 6 : isStage5 ? 3 : isStage4 ? 5 : 2; // 3-й=2, 6-й=5, 4-й=3, 7-й=6 (0-based)
    const tartibBilanCurrentIndex = isStage2
      ? TARTIB_EDITABLE_STAGE2.find((i) => tartibBilanValues[i] === '')
      : isStage1
        ? tartibBilanValues.slice(0, 5).findIndex((v) => v === '')
        : tartibBilanValues.findIndex((v) => v === '');
    const tartibCurrent = tartibBilanCurrentIndex === undefined || tartibBilanCurrentIndex === -1
      ? (isStage2 ? 8 : isStage1 ? 5 : 8)
      : isStage2
        ? (typeof tartibBilanCurrentIndex === 'number' ? tartibBilanCurrentIndex : 8)
        : tartibBilanCurrentIndex;
    const tartibMaxField = isStage2 ? 8 : isStage1 ? 5 : 8; // stage2: "full" when current=8
    const tartibDisplayValues = (isStage3 || isStage4)
      ? ['1', '2', '3', '4', '5', '6', '7', '8']
      : isStage2
        ? [tartibBilanValues[0], tartibBilanValues[1], tartibBilanValues[2], '4', tartibBilanValues[4], tartibBilanValues[5], tartibBilanValues[6], '8']
        : isStage1
          ? [...tartibBilanValues.slice(0, 5), '6', '7', '8']
          : tartibBilanValues;
    const TARTIB_BILAN_ETAPS = 8;
    const tartibBilanXp = TARTIB_BILAN_ETAPS * HP_PER_STAGE;
    const tartibBilanStage2Complete = isStage2 && TARTIB_EDITABLE_STAGE2.every((i) => tartibBilanValues[i] !== '');
    const tartibBilanCompleted = (isStage1 && tartibCurrent >= 5) || tartibBilanStage2Complete || (isStage3 && tartibBilanStage3Complete) || (isStage4 && tartibBilanStage4Complete) || (isStage5 && tartibBilanStage5Complete) || (isStage6 && tartibBilanStage6Complete) || (isStage7 && tartibBilanStage7Complete);
    const tartibBilanProgress = (tartibBilanStage + (tartibBilanCompleted ? 1 : 0)) / TARTIB_BILAN_ETAPS;
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        {tartibBilanStage7Complete ? (
          <div className="flex flex-col h-full items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="text-center max-w-md">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow mb-6">
                Tabriklaymiz!
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 drop-shadow mb-10">
                +{tartibBilanXp}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (childId && courseId && lessonSlug) {
                    fetch(`/api/child/${childId}/lesson-complete`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ courseId, lessonSlug, xp: tartibBilanXp }),
                    }).catch(() => {});
                  }
                  onComplete?.();
                }}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-md"
              >
                Davom etish
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        ) : (
        <>
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
            {tartibBilanProgress > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${tartibBilanProgress * 100}%` }}
                aria-hidden
              />
            )}
            {Array.from({ length: TARTIB_BILAN_ETAPS }).map((_, i) => (
              <span
                key={i}
                className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0"
                aria-hidden
              />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className={`absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-2 gap-2 overflow-y-auto ${(isStage3 || isStage4 || isStage5 || isStage6 || isStage7) ? 'pb-4' : 'pb-[5.5rem]'}`}>
          <div className="flex items-center justify-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAudioClick}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
              }`}
              aria-label="Ovoz"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            <p className="text-black text-xl sm:text-2xl md:text-3xl font-bold text-center shrink-0">
              {isStage7 ? '1 va 5-uyni toping' : isStage6 ? '7-uyni toping' : isStage5 ? '4-uyni toping' : isStage4 ? '6-uyni toping' : isStage3 ? '3-uyni toping' : 'Har bir uychaning raqamini yoz'}
            </p>
          </div>
          <div className="w-full flex flex-nowrap gap-0 shrink-0 mt-[3cm] overflow-visible">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const idx = i - 1;
              const isPreFilled = (isStage1 && idx >= 5) || (isStage2 && (idx === 3 || idx === 7)); // этап1: 6,7,8; этап2: 4 и 8
              const isFindStage = isStage3 || isStage4 || isStage5 || isStage6 || isStage7;
              const isCurrent = !isFindStage && !isPreFilled && idx === tartibCurrent;
              const isFindCorrectSingle = isFindStage && !isStage7 && ((isStage3 && tartibBilanStage3Complete) || (isStage4 && tartibBilanStage4Complete) || (isStage5 && tartibBilanStage5Complete) || (isStage6 && tartibBilanStage6Complete)) && idx === TARTIB_FIND_CORRECT_INDEX;
              const isFindCorrectStage7 = isStage7 && tartibBilanStage7Found.includes(idx);
              const isFindCorrect = isFindCorrectSingle || isFindCorrectStage7;
              const findStageDone = (isStage3 && tartibBilanStage3Complete) || (isStage4 && tartibBilanStage4Complete) || (isStage5 && tartibBilanStage5Complete) || (isStage6 && tartibBilanStage6Complete) || (isStage7 && tartibBilanStage7Complete);
              return (
                <div
                  key={i}
                  role={isFindStage ? 'button' : undefined}
                  tabIndex={isFindStage ? 0 : undefined}
                  onClick={isFindStage ? () => {
                    if (findStageDone) return;
                    if (isStage7) {
                      if (TARTIB_STAGE7_CORRECT_INDICES.includes(idx)) {
                        if (!tartibBilanStage7Found.includes(idx)) {
                          const newFound = [...tartibBilanStage7Found, idx];
                          setTartibBilanStage7Found(newFound);
                          if (newFound.length === 2) setTartibBilanStage7Complete(true);
                          new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                        }
                      } else {
                        new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                      }
                    } else if (idx === TARTIB_FIND_CORRECT_INDEX) {
                      new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                      if (isStage3) setTartibBilanStage3Complete(true);
                      else if (isStage4) setTartibBilanStage4Complete(true);
                      else if (isStage5) setTartibBilanStage5Complete(true);
                      else setTartibBilanStage6Complete(true);
                    } else {
                      new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                    }
                  } : undefined}
                  onKeyDown={isFindStage ? (e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); } : undefined}
                  className={`flex-1 min-w-0 aspect-[3/4] relative overflow-visible ${isFindStage ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${(isStage5 || isStage6 || isStage7) && isFindCorrect ? 'ring-4 ring-green-500 rounded-lg' : ''}`}
                  style={i > 0 ? { marginLeft: 'calc(-25% / 8)' } : undefined}
                >
                  <Image
                    src={`${imageBaseUrl}/house.png`}
                    alt=""
                    fill
                    className="object-contain scale-125"
                    sizes="(max-width: 768px) 12.5vw, 12.5vw"
                  />
                  {!isStage5 && !isStage6 && !isStage7 && (
                  <div
                    className={`absolute w-[45%] min-h-[22%] rounded-[2rem] border-2 flex items-center justify-center font-bold ${
                      isFindCorrect
                        ? 'border-green-500 ring-2 ring-green-500/40 bg-green-50 text-[#3f4699]'
                        : isCurrent
                          ? 'border-[#3f4699] ring-2 ring-[#3f4699]/30 bg-white text-[#3f4699]'
                          : isPreFilled
                            ? 'border-gray-400 bg-gray-100 text-gray-600'
                            : 'border-gray-400 bg-gray-200/90 text-gray-500'
                    }`}
                    style={{
                      bottom: 'calc(28% + 1.8cm)',
                      left: 'calc(50% + 0.25cm)',
                      transform: 'translateX(-50%)',
                      fontSize: 'clamp(0.75rem, 4vw, 1.25rem)',
                    }}
                  >
                    {tartibDisplayValues[idx] || ''}
                    {isCurrent && !isFindStage && (
                      <span className="animate-blink text-[#3f4699] ml-0.5" aria-hidden>|</span>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        {((tartibBilanStage3Complete && tartibBilanStage === 3) || (tartibBilanStage4Complete && tartibBilanStage === 4) || (tartibBilanStage5Complete && tartibBilanStage === 5) || (tartibBilanStage6Complete && tartibBilanStage === 6)) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 p-6">
            <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Tabriklaymiz!</p>
              <button
                type="button"
                onClick={() => {
                  if (tartibBilanStage3Complete && tartibBilanStage === 3) {
                    setTartibBilanStage(4);
                  } else if (tartibBilanStage4Complete && tartibBilanStage === 4) {
                    setTartibBilanStage(5);
                  } else if (tartibBilanStage5Complete && tartibBilanStage === 5) {
                    setTartibBilanStage(6);
                  } else if (tartibBilanStage6Complete && tartibBilanStage === 6) {
                    setTartibBilanStage(7);
                    setTartibBilanStage7Found([]);
                    setTartibBilanStage7Complete(false);
                  } else {
                    onComplete?.();
                  }
                }}
                className="w-full py-4 rounded-xl bg-[#3f4699] hover:bg-[#323d82] text-white font-bold text-lg transition-colors"
              >
                Davom etish
              </button>
            </div>
          </div>
        )}
        {!isStage3 && !isStage4 && !isStage5 && !isStage6 && !isStage7 && (
        /* Klaviatura: fon to'rtburchak, 1–0 va backspace */
        <div className="absolute left-0 right-0 bottom-0 z-10 rounded-t-2xl px-3 pt-3 pb-6 sm:pb-8 safe-area-pb" style={{ backgroundColor: '#e3e8f4' }}>
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (tartibCurrent >= tartibMaxField) return;
                  const expected = tartibCurrent + 1; // 1–8 или 1–5 по порядку
                  const isCorrect = num === expected;
                  const idxToCheck = tartibCurrent;
                  setTartibBilanValues((prev) => {
                    const next = [...prev];
                    next[idxToCheck] = String(num);
                    return next;
                  });
                  if (isCorrect) {
                    new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                    if (!isStage1 && !isStage2 && idxToCheck === 7) {
                      setTimeout(() => {
                        setTartibBilanStage(1);
                        setTartibBilanValues(['', '', '', '', '', '6', '7', '8']);
                      }, 1200);
                    } else if (isStage1 && idxToCheck === 4) {
                      setTimeout(() => {
                        setTartibBilanStage(2);
                        setTartibBilanValues(['', '', '', '4', '', '', '', '8']);
                      }, 1200);
                    } else if (isStage2 && idxToCheck === 6) {
                      setTimeout(() => setTartibBilanStage(3), 1200);
                    }
                  } else {
                    new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                    setTimeout(() => {
                      setTartibBilanValues((prev) => {
                        const next = [...prev];
                        next[idxToCheck] = '';
                        return next;
                      });
                    }, 800);
                  }
                }}
                className="rounded-xl bg-white text-[#3f4699] font-bold shadow-sm border border-gray-200/80 hover:bg-gray-50 active:scale-95 transition-transform w-[3.15rem] h-[3.85rem] sm:w-[3.85rem] sm:h-[4.2rem] text-[1.575rem] sm:text-[1.75rem]"
                aria-label={String(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (isStage2) {
                  const lastFilled = [6, 5, 4, 2, 1, 0].find((i) => tartibBilanValues[i] !== '');
                  if (lastFilled === undefined) return;
                  setTartibBilanValues((prev) => {
                    const next = [...prev];
                    next[lastFilled] = '';
                    return next;
                  });
                } else {
                  if (tartibCurrent <= 0) return;
                  setTartibBilanValues((prev) => {
                    const next = [...prev];
                    next[tartibCurrent - 1] = '';
                    return next;
                  });
                }
              }}
              className="rounded-xl flex items-center justify-center shadow-sm border border-gray-200/80 hover:bg-gray-100 active:scale-95 transition-transform w-[3.15rem] h-[3.85rem] sm:w-[3.85rem] sm:h-[4.2rem]"
              style={{ backgroundColor: '#dce8f9' }}
              aria-label="O'chirish"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#7a9fd4' }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d="M21 12H8M8 12l5-5M8 12l5 5" />
              </svg>
            </button>
          </div>
        </div>
        )}
        </>
        )}
      </div>
    );
  }

  // Bo'lim 2, Topshiriq 2: etap 1–8, oxirgi — Ali uy 4
  const ALI_UY_ETAPS = 8;
  const ALI_UY_XP = 15;
  if (isAliNechanchiUy) {
    if (aliUyShowFinalScreen) {
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <div className="flex flex-col h-full items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="text-center max-w-md">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow mb-6">
                Tabriklaymiz!
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 drop-shadow mb-10">
                +{ALI_UY_XP}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (childId && courseId && lessonSlug) {
                    fetch(`/api/child/${childId}/lesson-complete`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ courseId, lessonSlug, xp: ALI_UY_XP }),
                    }).catch(() => {});
                  }
                  onComplete?.();
                }}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-md"
              >
                Davom etish
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    const aliUyCorrect = aliUyStage === 1 ? 2 : aliUyStage === 2 ? 5 : aliUyStage === 3 ? 6 : aliUyStage === 4 ? 1 : aliUyStage === 5 ? 7 : aliUyStage === 6 ? 8 : aliUyStage === 7 ? 3 : 4;
    const aliUyQuestion = aliUyStage === 1 || aliUyStage === 5 || aliUyStage === 8 ? 'Ali nechanchi uyning yonida?' : aliUyStage === 2 || aliUyStage === 6 ? 'Lola nechanchi uyning yonida?' : aliUyStage === 3 || aliUyStage === 7 ? 'Akram nechanchi uyning yonida?' : 'Soliha nechanchi uyning yonida?';
    const aliUyCharacterHouse = aliUyStage === 1 ? 2 : aliUyStage === 2 ? 5 : aliUyStage === 3 ? 6 : aliUyStage === 4 ? 1 : aliUyStage === 5 ? 7 : aliUyStage === 6 ? 8 : aliUyStage === 7 ? 3 : 4;
    const kosmikBase = imageBaseUrl.replace('2-buyumlarni-qayta-sanash', '1-kosmik-sarguzasht');
    const aliUyProgress = (aliUyStage - 1) / ALI_UY_ETAPS + (aliUyAnswer === String(aliUyCorrect) ? 1 / ALI_UY_ETAPS : 0);
    const handleAliUyAudio = () => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        const src = aliUyStage === 1 || aliUyStage === 5 || aliUyStage === 8 ? `${imageBaseUrl}/ali-uy.mp3` : aliUyStage === 2 || aliUyStage === 6 ? `${imageBaseUrl}/lola-uy.mp3` : aliUyStage === 3 || aliUyStage === 7 ? `${imageBaseUrl}/akram-uy.mp3` : `${imageBaseUrl}/soliha-uy.mp3`;
        const a = new Audio(src);
        a.play().catch(() => {});
      } catch {
        // ignore
      }
    };
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
            {aliUyProgress > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${aliUyProgress * 100}%` }}
                aria-hidden
              />
            )}
            {Array.from({ length: ALI_UY_ETAPS }).map((_, i) => (
              <span key={i} className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0" aria-hidden />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-2 gap-2 overflow-y-auto pb-[5.5rem]">
          <div className="flex items-center justify-center gap-2 shrink-0 mt-[2cm]">
            <button
              type="button"
              onClick={handleAliUyAudio}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
              }`}
              aria-label="Ovoz"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            <p className="text-black text-xl sm:text-2xl md:text-3xl font-bold text-center shrink-0">
              {aliUyQuestion}
            </p>
            <div
              className="min-w-[4.5rem] h-14 sm:h-16 rounded-2xl border-4 flex items-center justify-center font-bold text-3xl sm:text-4xl text-[#3f4699] bg-amber-50 border-amber-500 shadow-lg ring-2 ring-amber-400/50 shrink-0"
              style={{ minWidth: '5rem' }}
            >
              {aliUyAnswer || <span className="animate-blink text-[#3f4699]">|</span>}
            </div>
          </div>
          <div className="w-full flex flex-nowrap gap-0 shrink-0 mt-[2cm] overflow-visible">
            {(() => {
              const characterImg = aliUyStage === 1 || aliUyStage === 5 || aliUyStage === 8 ? `${kosmikBase}/ali.png` : aliUyStage === 2 || aliUyStage === 6 ? `${kosmikBase}/lola.png` : aliUyStage === 3 || aliUyStage === 7 ? `${kosmikBase}/akram.png` : `${kosmikBase}/soliha.png`;
              const characterName = aliUyStage === 1 || aliUyStage === 5 || aliUyStage === 8 ? 'Ali' : aliUyStage === 2 || aliUyStage === 6 ? 'Lola' : aliUyStage === 3 || aliUyStage === 7 ? 'Akram' : 'Soliha';
              return [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-0 aspect-[3/4] relative overflow-visible"
                style={i > 0 ? { marginLeft: 'calc(-25% / 8)' } : undefined}
              >
                <Image
                  src={`${imageBaseUrl}/house2.png`}
                  alt=""
                  fill
                  className="object-contain scale-125"
                  sizes="(max-width: 768px) 12.5vw, 12.5vw"
                />
                {i === aliUyCharacterHouse && (
                  <div className="absolute inset-0 flex items-end justify-center pointer-events-none" style={{ bottom: '-5%' }}>
                    <div className="relative w-[55%] h-[50%]" style={{ transform: 'scale(2)' }}>
                      <Image src={characterImg} alt={characterName} fill className="object-contain object-bottom" sizes="(max-width: 768px) 15vw, 15vw" />
                    </div>
                  </div>
                )}
              </div>
            ));
            })()}
          </div>
        </div>
        {aliUyAnswer === String(aliUyCorrect) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 p-6 pointer-events-none">
            <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                {aliUyStage === ALI_UY_ETAPS ? 'Tabriklaymiz!' : "To'g'ri!"}
              </p>
            </div>
          </div>
        )}
        {/* Klaviatura: javob 1–8, to'g'ri etap 1 → 2, etap 2 → 5 */}
        <div className="absolute left-0 right-0 bottom-0 z-10 rounded-t-2xl px-3 pt-3 pb-6 sm:pb-8 safe-area-pb" style={{ backgroundColor: '#e3e8f4' }}>
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (aliUyAnswer !== '') return;
                  const isCorrect = num === aliUyCorrect;
                  const currentStage = aliUyStage;
                  setAliUyAnswer(String(num));
                  if (isCorrect) {
                    new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                    setTimeout(() => {
                      if (currentStage < ALI_UY_ETAPS) {
                        setAliUyStage(currentStage + 1);
                        setAliUyAnswer('');
                      } else {
                        try {
                          new Audio(`${imageBaseUrl}/end.mp3`).play().catch(() => {});
                        } catch {
                          // ignore
                        }
                        setAliUyShowFinalScreen(true);
                      }
                    }, 2000);
                  } else {
                    new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                    setTimeout(() => setAliUyAnswer(''), 800);
                  }
                }}
                className="rounded-xl bg-white text-[#3f4699] font-bold shadow-sm border border-gray-200/80 hover:bg-gray-50 active:scale-95 transition-transform w-[3.15rem] h-[3.85rem] sm:w-[3.85rem] sm:h-[4.2rem] text-[1.575rem] sm:text-[1.75rem]"
                aria-label={String(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAliUyAnswer('')}
              className="rounded-xl flex items-center justify-center shadow-sm border border-gray-200/80 hover:bg-gray-100 active:scale-95 transition-transform w-[3.15rem] h-[3.85rem] sm:w-[3.85rem] sm:h-[4.2rem]"
              style={{ backgroundColor: '#dce8f9' }}
              aria-label="O'chirish"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#7a9fd4' }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d="M21 12H8M8 12l5-5M8 12l5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bo'lim 2, Topshiriq 3: Katak qog'oz va ruchka ol — matn, audio, rasm kletka, Tayyor
  if (isKatakQogoz) {
    const handleKatakAudio = () => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        new Audio(`${imageBaseUrl}/katak-qogoz.mp3`).play().catch(() => {});
      } catch {
        // ignore
      }
    };
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
            {Array.from({ length: 1 }).map((_, i) => (
              <span key={i} className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0" aria-hidden />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-4 pb-8 overflow-y-auto">
          <div className="flex items-center justify-center gap-2 shrink-0 mt-[1.5cm]">
            <button
              type="button"
              onClick={handleKatakAudio}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
              }`}
              aria-label="Ovoz"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            <p className="text-black text-xl sm:text-2xl md:text-3xl font-bold text-center shrink-0">
              Katak qog&apos;oz va ruchka ol
            </p>
          </div>
          <div className="relative w-full max-w-md aspect-square mt-6 flex-shrink-0 rounded-3xl overflow-hidden">
            <Image
              src={`${imageBaseUrl}/kletka2.png`}
              alt="Katak qog'oz"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 90vw, 28rem"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={() => onComplete?.()}
            className="mt-6 px-10 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-lg"
          >
            Oldim!
          </button>
        </div>
      </div>
    );
  }

  // Bo'lim 2, Topshiriq 3: avval "Katak qog'oz va ruchka ol" (intro), keyin 10 etap raqam yozish (1..9, 0)
  const RAQAM_YOZISH_ETAPS = 10;
  const RAQAM_YOZISH_XP = 100;
  const RAQAM_YOZISH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  if (isRaqamYozish) {
    if (raqamYozishShowFinalScreen) {
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <div className="flex flex-col h-full items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="text-center max-w-md">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-green-500 drop-shadow mb-6">
                Tabriklaymiz!
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 drop-shadow mb-10">
                +{RAQAM_YOZISH_XP}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (childId && courseId && lessonSlug) {
                    fetch(`/api/child/${childId}/lesson-complete`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ courseId, lessonSlug, xp: RAQAM_YOZISH_XP }),
                    }).catch(() => {});
                  }
                  onComplete?.();
                }}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-md"
              >
                Davom etish
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    const isIntro = raqamYozishStage === 0;
    const currentNum = isIntro ? 1 : RAQAM_YOZISH_NUMBERS[raqamYozishStage - 1];
    const raqamYozishProgress = isIntro ? 0 : (raqamYozishStage - 1) / RAQAM_YOZISH_ETAPS + (raqamYozishShowBarakalla ? 1 / RAQAM_YOZISH_ETAPS : 0);
    const handleKatakAudio = () => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        new Audio(`${imageBaseUrl}/katak-qogoz.mp3`).play().catch(() => {});
      } catch {
        // ignore
      }
    };
    const handleRaqamYozishAudio = () => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        new Audio(`${imageBaseUrl}/qalam-ol.mp3`).play().catch(() => {});
      } catch {
        // ignore
      }
    };
    const handleBoldiClick = () => {
      const stageAtClick = raqamYozishStage;
      setRaqamYozishShowBarakalla(true);
      setTimeout(() => {
        setRaqamYozishShowBarakalla(false);
        if (stageAtClick < RAQAM_YOZISH_ETAPS) {
          setRaqamYozishStage(stageAtClick + 1);
        } else {
          try {
            new Audio(`${imageBaseUrl}/end.mp3`).play().catch(() => {});
          } catch {
            // ignore
          }
          setRaqamYozishShowFinalScreen(true);
        }
      }, 1000);
    };
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          {!isIntro ? (
            <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
              {raqamYozishProgress > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${raqamYozishProgress * 100}%` }}
                  aria-hidden
                />
              )}
              {Array.from({ length: RAQAM_YOZISH_ETAPS }).map((_, i) => (
                <span key={i} className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0" aria-hidden />
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-3 pb-8 overflow-y-auto">
          {isIntro ? (
            <>
              <div className="flex items-center justify-center gap-2 shrink-0 mt-[1.5cm]">
                <button
                  type="button"
                  onClick={handleKatakAudio}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                    audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
                  }`}
                  aria-label="Ovoz"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <p className="text-black text-xl sm:text-2xl md:text-3xl font-bold text-center shrink-0">
                  Katak qog&apos;oz va ruchka ol
                </p>
              </div>
              <div className="relative w-full max-w-md aspect-square mt-6 flex-shrink-0 rounded-3xl overflow-hidden">
                <Image
                  src={`${imageBaseUrl}/kletka2.png`}
                  alt="Katak qog'oz"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 28rem"
                  unoptimized
                />
              </div>
              <button
                type="button"
                onClick={() => setRaqamYozishStage(1)}
                className="mt-6 px-10 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-lg"
              >
                Oldim!
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 shrink-0 mt-6 flex-wrap">
                <button
                  type="button"
                  onClick={handleRaqamYozishAudio}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                    audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
                  }`}
                  aria-label="Ovoz"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <p className="text-black text-2xl sm:text-3xl md:text-4xl font-bold text-center shrink-0">
                  {currentNum} raqamini yozishni o&apos;rganamiz
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 shrink-0 mt-4 flex-wrap">
                <button
                  type="button"
                  onClick={handleRaqamYozishAudio}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                    audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
                  }`}
                  aria-label="Ovoz"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center shrink-0">
                  Qalamni ol va rasmda ko&apos;rsatilgandek qadam-baqadam takrorla. 3 marta yoz
                </p>
              </div>
              <div className="relative w-full max-w-[14rem] aspect-square mt-4 flex-shrink-0 overflow-visible flex items-center justify-center pointer-events-none">
                <div className="relative w-full aspect-square" style={{ transform: 'scale(10)' }}>
                  <Image
                    src={`${imageBaseUrl}/number${currentNum}.svg`}
                    alt={`Raqam ${currentNum}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, 14rem"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleBoldiClick}
                className="relative z-10 mt-[calc(1.5rem+2cm)] px-10 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-lg"
              >
                Yozdim
              </button>
            </>
          )}
        </div>
        {raqamYozishShowBarakalla && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 p-6 pointer-events-none">
            <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">Barakalla!</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Block 4 task 1: faqat fon va progress bar (fon_blok4.png)
  if (isBlock4Task1) {
    const BLOCK4_TASK1_STEPS = 1;
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon_blok4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button type="button" onClick={onBack} className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10" aria-label="Orqaga">
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] px-2 overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all" style={{ width: `${(1 / BLOCK4_TASK1_STEPS) * 100}%` }} aria-hidden />
            {Array.from({ length: BLOCK4_TASK1_STEPS }).map((_, i) => (
              <span key={i} className="relative z-10 w-1.5 h-1.5 rounded-full shrink-0 bg-amber-200 ring-2 ring-white" aria-hidden />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
      </div>
    );
  }

  // Block 3 task 1: etaplar — birinchi: odamlar soni, ikkinchi: tartib sonlar
  // Block 3 task 2: etap 0 — nechta aylana; etaplar 1–6 — qaysi rang nechanchi o'rinda (qizil, ko'k, yashil, sariq, binafsha, toq sariq)
  if (isBlock3Task2) {
    const BLOCK3_TASK2_STEPS = 7;
    const TASK2_ORDINALS = ["Birinchi", "Ikkinchi", "Uchinchi", "To'rtinchi", "Beshinchi", "Oltinchi"] as const;
    const TASK2_ORDINAL_AUDIO = ['birinchi.mp3', 'ikkinchi.mp3', 'uchinchi.mp3', 'tortinchi.mp3', 'beshinchi.mp3', 'oltinchi.mp3'] as const;
    const TASK2_COLOR_PROMPTS = ["Qizil aylana nechanchi o'rinda?", "Ko'k aylana nechanchi o'rinda?", "Yashil aylana nechanchi o'rinda?", "Sariq aylana nechanchi o'rinda?", "Binafsha aylana nechanchi o'rinda?", "Toq sariq aylana nechanchi o'rinda?"] as const;
    const TASK2_COLOR_AUDIO = ['qizil-aylana-nechanchi.mp3', 'kok-aylana-nechanchi.mp3', 'yashil-aylana-nechanchi.mp3', 'sariq-aylana-nechanchi.mp3', 'binafsha-aylana-nechanchi.mp3', 'toq-sariq-aylana-nechanchi.mp3'] as const;
    const circleColorClasses = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-400', 'bg-purple-500', 'bg-orange-500'];

    const playTask2OrdinalAudio = (ordinalIndex: number) => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        new Audio(`${imageBaseUrl}/${TASK2_ORDINAL_AUDIO[ordinalIndex]}`).play().catch(() => {});
      } catch {
        // ignore
      }
    };

    const handleTask2Audio = (stage: number) => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        const src = stage === 0 ? `${imageBaseUrl}/ekranda-nechta-aylana.mp3` : `${imageBaseUrl}/${TASK2_COLOR_AUDIO[stage - 1]}`;
        new Audio(src).play().catch(() => {});
      } catch {
        // ignore
      }
    };

    const correctOrdinalIndex = block3Task2Stage >= 1 && block3Task2Stage <= 6 ? block3Task2Stage - 1 : 0;
    let stage1Options: number[] | null = null;
    const ref = block3Task2Stage1OptionsRef.current;
    if (block3Task2Stage >= 1 && block3Task2Stage <= 6) {
      if (ref === null || ref.stage !== block3Task2Stage) {
        const wrongIndices = [0, 1, 2, 3, 4, 5].filter((i) => i !== correctOrdinalIndex);
        const wrong1 = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
        const wrong2 = wrongIndices.filter((i) => i !== wrong1)[Math.floor(Math.random() * 4)];
        stage1Options = [correctOrdinalIndex, wrong1, wrong2];
        for (let i = stage1Options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [stage1Options[i], stage1Options[j]] = [stage1Options[j], stage1Options[i]];
        }
        block3Task2Stage1OptionsRef.current = { stage: block3Task2Stage, options: stage1Options };
      } else {
        stage1Options = ref.options;
      }
    }

    const circleColorsStage0 = circleColorClasses;
    const circleColorsOrdinal = circleColorClasses;

    const BLOCK3_TASK2_XP = 70;
    if (block3Task2ShowCongrats) {
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center">
            <p className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Barakalla!</p>
            <p className="text-4xl sm:text-5xl font-bold text-amber-600 mb-8">{BLOCK3_TASK2_XP} ball</p>
            <button
              type="button"
              onClick={() => {
                if (childId && courseId && lessonSlug) {
                  fetch(`/api/child/${childId}/lesson-complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId, lessonSlug, xp: BLOCK3_TASK2_XP }),
                  }).catch(() => {});
                }
                onComplete?.();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl shadow-lg transition-colors"
            >
              Davom etish
              <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button type="button" onClick={onBack} className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10" aria-label="Orqaga">
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] px-2 overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all" style={{ width: `${((block3Task2Stage + 1) / BLOCK3_TASK2_STEPS) * 100}%` }} aria-hidden />
            {Array.from({ length: BLOCK3_TASK2_STEPS }).map((_, i) => (
              <span key={i} className={`relative z-10 w-1.5 h-1.5 rounded-full shrink-0 ${i <= block3Task2Stage ? 'bg-amber-200 ring-2 ring-white' : 'bg-white/70'}`} aria-hidden />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-4 gap-4 overflow-y-auto pb-8">
          {block3Task2Stage === 0 ? (
            <>
              <div className="flex items-center justify-center gap-2 shrink-0">
                <button type="button" onClick={() => handleTask2Audio(0)} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`} aria-label="Ovoz">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                </button>
                <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center">
                  Ekranda nechta aylana chizilgan?
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4" style={{ marginTop: '2cm' }}>
                {circleColorsStage0.map((color, i) => (
                  <div key={i} className={`rounded-full shrink-0 ${color} shadow-md`} style={{ width: '4cm', height: '4cm', maxWidth: 'min(4cm, 18vw)', maxHeight: 'min(4cm, 18vw)' }} aria-hidden />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-5" style={{ marginTop: '1cm' }}>
                {[4, 5, 6].map((value) => {
                  const correctAnswer = 6;
                  const selected = block3Task2Selected === value;
                  const showRight = block3Task2Selected !== null && selected && value === correctAnswer;
                  const showWrong = block3Task2Selected !== null && selected && value !== correctAnswer;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (block3Task2Selected === 6) return;
                        setBlock3Task2Selected(value);
                        try { new Audio(`${imageBaseUrl}/${value === correctAnswer ? 'correct' : 'wrong'}.mp3`).play().catch(() => {}); } catch { /* ignore */ }
                      }}
                      disabled={block3Task2Selected === 6}
                      className={`min-w-[5.5rem] sm:min-w-[6.5rem] py-4 sm:py-5 px-8 sm:px-10 rounded-3xl font-bold text-2xl sm:text-3xl shadow-xl transition-all duration-200 active:scale-95 ${
                        showRight ? 'bg-gradient-to-b from-green-500 to-green-600 border-2 border-green-700 text-white shadow-green-500/30' : showWrong ? 'bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 text-white shadow-red-500/30' : 'bg-gradient-to-b from-white to-gray-50 border-2 border-sky-200/80 text-gray-800 hover:from-sky-50 hover:to-white hover:border-sky-300 hover:shadow-2xl'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              {block3Task2Selected === 6 && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl bg-green-500/95 text-white font-bold text-xl shadow-lg animate-fade-in" role="alert">
                  To&apos;g&apos;ri!
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 shrink-0">
                <button type="button" onClick={() => handleTask2Audio(block3Task2Stage)} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`} aria-label="Ovoz">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                </button>
                <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center">
                  {TASK2_COLOR_PROMPTS[block3Task2Stage - 1]}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4" style={{ marginTop: '2cm' }}>
                {circleColorsOrdinal.map((color, i) => (
                  <div key={i} className={`rounded-full shrink-0 ${color} shadow-md`} style={{ width: '4cm', height: '4cm', maxWidth: 'min(4cm, 18vw)', maxHeight: 'min(4cm, 18vw)' }} aria-hidden />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-5" style={{ marginTop: '1cm' }}>
                {(stage1Options ?? [0, 1, 2]).map((ordinalIndex) => {
                  const label = TASK2_ORDINALS[ordinalIndex];
                  const correct = ordinalIndex === correctOrdinalIndex;
                  const selected = block3Task2Stage1Selected === ordinalIndex;
                  const showRight = block3Task2Stage1Selected !== null && selected && correct;
                  const showWrong = block3Task2Stage1Selected !== null && selected && !correct;
                  const correctSelected = block3Task2Stage1Selected === correctOrdinalIndex;
                  return (
                    <div
                      key={ordinalIndex}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (correctSelected) return;
                        setBlock3Task2Stage1Selected(ordinalIndex);
                        try { new Audio(`${imageBaseUrl}/${correct ? 'correct' : 'wrong'}.mp3`).play().catch(() => {}); } catch { /* ignore */ }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (correctSelected) return;
                          setBlock3Task2Stage1Selected(ordinalIndex);
                          try { new Audio(`${imageBaseUrl}/${correct ? 'correct' : 'wrong'}.mp3`).play().catch(() => {}); } catch { /* ignore */ }
                        }
                      }}
                      className={`min-w-[5.5rem] sm:min-w-[7rem] py-4 sm:py-5 px-4 sm:px-6 rounded-3xl font-bold text-lg sm:text-xl shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer select-none ${correctSelected ? 'cursor-default' : ''} ${
                        showRight ? 'bg-gradient-to-b from-green-500 to-green-600 border-2 border-green-700 text-white shadow-green-500/30' : showWrong ? 'bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 text-white shadow-red-500/30' : 'bg-gradient-to-b from-white to-gray-50 border-2 border-sky-200/80 text-gray-800 hover:from-sky-50 hover:to-white hover:border-sky-300 hover:shadow-2xl'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); playTask2OrdinalAudio(ordinalIndex); }}
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${showRight || showWrong ? 'text-white/90 hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'}`}
                        aria-label="Ovoz"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      </button>
                      {label}
                    </div>
                  );
                })}
              </div>
              {block3Task2Stage1Selected === correctOrdinalIndex && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl bg-green-500/95 text-white font-bold text-xl shadow-lg animate-fade-in" role="alert">
                  To&apos;g&apos;ri!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (isBlock3Task1) {
    const handleBolim3Audio = (src: string) => {
      setAudioPressed(true);
      setTimeout(() => setAudioPressed(false), 300);
      try {
        new Audio(src).play().catch(() => {});
      } catch {
        // ignore
      }
    };
    const block3Correct = 4;
    const pointsPerEtap = 10;
    const totalBlock3Task1Etaps = 10;
    const totalBlock3Task1Xp = pointsPerEtap * totalBlock3Task1Etaps;

    // Tabriklash ekrani: barcha etaplar bajarilgach
    if (block3ShowCongrats) {
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center p-6"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center">
            <p className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Barakalla!</p>
            <p className="text-4xl sm:text-5xl font-bold text-amber-600 mb-8">{totalBlock3Task1Xp} ball</p>
            <button
              type="button"
              onClick={() => {
                if (childId && courseId && lessonSlug) {
                  fetch(`/api/child/${childId}/lesson-complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId, lessonSlug, xp: totalBlock3Task1Xp }),
                  }).catch(() => {});
                }
                onComplete?.();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl shadow-lg transition-colors"
            >
              Davom etish
              <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      );
    }

    const BLOCK3_TASK1_ETAP2 = [
      { name: 'Lola' as const, text: "Men birinchi", audio: 'men-birinchi.mp3' },
      { name: 'Akram' as const, text: "Men ikkinchi", audio: 'men-ikkinchi.mp3' },
      { name: 'Ali' as const, text: "Men uchinchi", audio: 'men-uchinchi.mp3' },
      { name: 'Soliha' as const, text: "Men to'rtinchi", audio: 'men-tortinchi.mp3' },
    ];
    const BLOCK3_TASK1_QUIZ_STAGES = [
      { prompt: "Ikkinchida turgan bolani tanla", correctIndex: 1 },
      { prompt: "Birinchida turgan bolani tanla", correctIndex: 0 },
      { prompt: "Uchinchida turgan bolani tanla", correctIndex: 2 },
      { prompt: "To'rtinchida turgan bolani tanla", correctIndex: 3 },
    ];
    const BLOCK3_TASK1_TOTAL_STAGES = 10;
    const BLOCK3_TASK1_ORDINAL_LABELS = ["Birinchi", "Ikkinchi", "Uchinchi", "To'rtinchi"] as const;
    const BLOCK3_TASK1_ORDINAL_AUDIO = ['men-birinchi.mp3', 'men-ikkinchi.mp3', 'men-uchinchi.mp3', 'men-tortinchi.mp3'] as const;
    const BLOCK3_TASK1_NECHANCHI_STAGES = [
      { prompt: "Ali nechanchi o'rinda?", correctIndex: 2, audio: 'ali-nechanchi.mp3' },
      { prompt: "Lola nechanchi o'rinda?", correctIndex: 0, audio: 'lola-nechanchi.mp3' },
      { prompt: "Akram nechanchi o'rinda?", correctIndex: 1, audio: 'akram-nechanchi.mp3' },
      { prompt: "Soliha nechanchi o'rinda?", correctIndex: 3, audio: 'soliha-nechanchi.mp3' },
    ] as const;

    // Etaplar 6–9: “X nechanchi o'rinda?” — har bir qahramon uchun tartibni tanlash
    let block3OrdinalOrder = block3Stage >= 6 && block3Stage <= 9 ? block3AliOrderRef.current[block3Stage] : undefined;
    if (block3Stage >= 6 && block3Stage <= 9 && !block3OrdinalOrder) {
      const order = [0, 1, 2, 3];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      block3AliOrderRef.current[block3Stage] = order;
      block3OrdinalOrder = order;
    }
    const block3OrdinalOrderSafe = block3OrdinalOrder ?? [0, 1, 2, 3];

    if (block3Stage >= 6 && block3Stage <= 9) {
      const nechanchiIndex = block3Stage - 6;
      const nechanchi = BLOCK3_TASK1_NECHANCHI_STAGES[nechanchiIndex];
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
            <button type="button" onClick={onBack} className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10" aria-label="Orqaga">
              <span className="text-2xl leading-none font-bold">←</span>
            </button>
            <div className="relative flex flex-1 max-w-[30rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] px-2 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all" style={{ width: `${((block3Stage + 1) / BLOCK3_TASK1_TOTAL_STAGES) * 100}%` }} aria-hidden />
              {Array.from({ length: BLOCK3_TASK1_TOTAL_STAGES }).map((_, i) => (
                <span key={i} className={`relative z-10 w-1.5 h-1.5 rounded-full shrink-0 ${i <= block3Stage ? 'bg-amber-200 ring-2 ring-white' : 'bg-white/70'}`} aria-hidden />
              ))}
            </div>
            <div className="w-10 shrink-0" />
          </header>
          <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-4 gap-4 overflow-y-auto pb-8">
            <div className="flex items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleBolim3Audio(`${imageBaseUrl}/${nechanchi.audio}`)}
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                aria-label="Ovoz"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
              <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center">
                {nechanchi.prompt}
              </p>
            </div>
            <div className="flex items-stretch justify-center gap-2 sm:gap-4 w-full max-w-2xl shrink-0" style={{ marginTop: '2cm' }}>
              {BLOCK3_TASK1_ETAP2.map(({ name, audio }) => (
                <div key={name} className="flex flex-col items-center flex-1 min-w-0">
                  <div className="origin-center" style={{ transform: 'scale(1.75)' }}>
                    <CharacterAvatar name={name} size="md" />
                  </div>
                  <div className="flex items-center justify-center gap-1.5" style={{ marginTop: '2cm' }}>
                    <button
                      type="button"
                      onClick={() => handleBolim3Audio(`${imageBaseUrl}/${audio}`)}
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                      aria-label="Ovoz"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    </button>
                    <span className="text-sm sm:text-base font-bold text-black text-center">{name}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-nowrap justify-center items-stretch gap-3 sm:gap-4 w-full max-w-3xl shrink-0 mt-4">
              {block3OrdinalOrderSafe.map((ordinalIndex) => {
                const label = BLOCK3_TASK1_ORDINAL_LABELS[ordinalIndex];
                const audioFile = BLOCK3_TASK1_ORDINAL_AUDIO[ordinalIndex];
                const isCorrect = ordinalIndex === nechanchi.correctIndex;
                return (
                  <div key={ordinalIndex} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleBolim3Audio(`${imageBaseUrl}/${audioFile}`); }}
                      className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                      aria-label="Ovoz"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (block3QuizShowNext) return;
                        if (isCorrect) {
                          new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                          setBlock3QuizShowNext(true);
                        } else {
                          new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                        }
                      }}
                      className="w-full px-4 py-4 sm:px-5 sm:py-5 rounded-2xl bg-white border-2 border-gray-200 text-lg sm:text-xl font-bold text-gray-800 hover:bg-gray-50 hover:border-sky-300 active:scale-95 transition-all shadow-sm"
                    >
                      {label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {block3QuizShowNext && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 p-6 pointer-events-none">
              <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">To&apos;g&apos;ri!</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Etaplar 3–6: “X turgan bolani tanla” — to‘g‘ri javobni tanlash
    if (block3Stage >= 2 && block3Stage <= 5) {
      const quizIndex = block3Stage - 2;
      const quiz = BLOCK3_TASK1_QUIZ_STAGES[quizIndex];
      const isLastQuiz = false;
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
            <button type="button" onClick={onBack} className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10" aria-label="Orqaga">
              <span className="text-2xl leading-none font-bold">←</span>
            </button>
            <div className="relative flex flex-1 max-w-[30rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] px-2 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all" style={{ width: `${((block3Stage + 1) / BLOCK3_TASK1_TOTAL_STAGES) * 100}%` }} aria-hidden />
              {Array.from({ length: BLOCK3_TASK1_TOTAL_STAGES }).map((_, i) => (
                <span key={i} className={`relative z-10 w-1.5 h-1.5 rounded-full shrink-0 ${i <= block3Stage ? 'bg-amber-200 ring-2 ring-white' : 'bg-white/70'}`} aria-hidden />
              ))}
            </div>
            <div className="w-10 shrink-0" />
          </header>
          <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-4 gap-4 overflow-y-auto pb-24">
            <div className="flex items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleBolim3Audio(`${imageBaseUrl}/tanla.mp3`)}
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                aria-label="Ovoz"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
              <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center">
                {quiz.prompt}
              </p>
            </div>
            <div className="flex items-stretch justify-center gap-2 sm:gap-4 flex-1 w-full max-w-2xl" style={{ marginTop: '3cm' }}>
              {BLOCK3_TASK1_ETAP2.map(({ name, text, audio }, index) => {
                const isCorrect = index === quiz.correctIndex;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      if (block3QuizShowNext) return;
                      if (isCorrect) {
                        new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                        setBlock3QuizShowNext(true);
                      } else {
                        new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                      }
                    }}
                    className="group flex flex-col items-center flex-1 min-w-0 active:scale-95 transition-transform"
                  >
                    <div className="origin-center" style={{ transform: 'scale(1.75)' }}>
                      <div className="transition-transform duration-200 group-hover:scale-110">
                        <CharacterAvatar name={name} size="md" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5" style={{ marginTop: '2cm' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleBolim3Audio(`${imageBaseUrl}/${audio}`); }}
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                        aria-label="Ovoz"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                      </button>
                      <span className="text-sm sm:text-base font-bold text-black text-center">{text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {block3QuizShowNext && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 p-6 pointer-events-none">
              <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
                <p className="text-2xl sm:text-3xl font-bold text-gray-800">To&apos;g&apos;ri!</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Ikkinchi etap: Tartib sonlarni o'rganamiz (Lola birinchi, Akram ikkinchi, ...)
    if (block3Stage === 1) {
      return (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
        >
          <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
            <button type="button" onClick={onBack} className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10" aria-label="Orqaga">
              <span className="text-2xl leading-none font-bold">←</span>
            </button>
            <div className="relative flex flex-1 max-w-[30rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] px-2 overflow-hidden">
              <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all" style={{ width: `${((block3Stage + 1) / BLOCK3_TASK1_TOTAL_STAGES) * 100}%` }} aria-hidden />
              {Array.from({ length: BLOCK3_TASK1_TOTAL_STAGES }).map((_, i) => (
                <span key={i} className={`relative z-10 w-1.5 h-1.5 rounded-full shrink-0 ${i <= block3Stage ? 'bg-amber-200 ring-2 ring-white' : 'bg-white/70'}`} aria-hidden />
              ))}
            </div>
            <div className="w-10 shrink-0" />
          </header>
          <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-4 gap-4 overflow-y-auto pb-24">
            <div className="flex items-center justify-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleBolim3Audio(`${imageBaseUrl}/tartib-sonlar.mp3`)}
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                aria-label="Ovoz"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
              <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center">
                Tartib sonlarni o&apos;rganamiz
              </p>
            </div>
            <div className="flex items-stretch justify-center gap-2 sm:gap-4 flex-1 w-full max-w-2xl" style={{ marginTop: '3cm' }}>
              {BLOCK3_TASK1_ETAP2.map(({ name, text, audio }) => (
                <div key={name} className="flex flex-col items-center flex-1 min-w-0">
                  <div className="origin-center" style={{ transform: 'scale(1.75)' }}>
                    <CharacterAvatar name={name} size="md" />
                  </div>
                  <div className="flex items-center justify-center gap-1.5" style={{ marginTop: '2cm' }}>
                    <button
                      type="button"
                      onClick={() => handleBolim3Audio(`${imageBaseUrl}/${audio}`)}
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-gray-600 transition-all active:scale-90 ${audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'}`}
                      aria-label="Ovoz"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                      </svg>
                    </button>
                    <span className="text-sm sm:text-base font-bold text-black text-center">{text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-0 right-0 z-10 px-4 py-4 safe-area-pb" style={{ bottom: '2cm' }}>
            <button
              type="button"
              onClick={() => setBlock3Stage(2)}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl shadow-md"
            >
              Davom etish
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      );
    }

    // Birinchi etap: ekranda nechta odam — javob 4
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all" style={{ width: `${((block3Stage + 1) / 10) * 100}%` }} aria-hidden />
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className={`relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${i <= block3Stage ? 'bg-amber-200 ring-2 ring-white' : 'bg-white/70'}`} aria-hidden />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0 flex flex-col items-center px-4 pt-2 gap-3 overflow-y-auto pb-[5.5rem]">
          <div className="flex items-center justify-center gap-2 shrink-0 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => handleBolim3Audio(`${imageBaseUrl}/ekranda-odam.mp3`)}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-700 transition-all duration-200 ease-out active:scale-90 ${
                audioPressed ? 'bg-gray-300' : 'bg-white/90 hover:bg-gray-100 border border-gray-300'
              }`}
              aria-label="Ovoz"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            <p className="text-black text-lg sm:text-xl md:text-2xl font-bold text-center shrink-0">
              Ekranda qancha odamni ko&apos;ryapsan?
            </p>
            <div
              className="min-w-[3.5rem] h-12 sm:h-14 rounded-2xl border-4 flex items-center justify-center font-bold text-2xl sm:text-3xl text-[#3f4699] bg-amber-50 border-amber-500 shadow-lg ring-2 ring-amber-400/50 shrink-0 px-3"
              style={{ minWidth: '4rem' }}
            >
              {block3Answer || <span className="animate-blink text-[#3f4699]">|</span>}
            </div>
          </div>
          <div className="relative w-full flex-1 min-h-[10rem] sm:min-h-[12rem] mt-2">
            {block3CharPositions.map(({ name, left, top }) => (
              <div
                key={name}
                className="absolute origin-center"
                style={{ left, top, transform: 'scale(1.75)' }}
              >
                <CharacterAvatar name={name} size="md" />
              </div>
            ))}
          </div>
        </div>
        {block3Answer === String(block3Correct) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30 p-6 pointer-events-none">
            <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-xl">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">To&apos;g&apos;ri!</p>
            </div>
          </div>
        )}
        <div className="absolute left-0 right-0 bottom-0 z-10 rounded-t-2xl px-3 pt-3 pb-6 sm:pb-8 safe-area-pb" style={{ backgroundColor: '#e3e8f4' }}>
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 max-w-4xl mx-auto flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (block3Answer !== '') return;
                  const isCorrect = num === block3Correct;
                  setBlock3Answer(String(num));
                  if (isCorrect) {
                    new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
                    // 1.2 sekunddan keyin ikkinchi etapga o‘tamiz (Tartib sonlar)
                    setTimeout(() => {
                      setBlock3Stage(1);
                      setBlock3Answer('');
                    }, 1200);
                  } else {
                    new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
                    setTimeout(() => setBlock3Answer(''), 800);
                  }
                }}
                className="rounded-xl bg-white text-[#3f4699] font-bold shadow-sm border border-gray-200/80 hover:bg-gray-50 active:scale-95 transition-transform w-[3.15rem] h-[3.85rem] sm:w-[3.85rem] sm:h-[4.2rem] text-[1.575rem] sm:text-[1.75rem]"
                aria-label={String(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBlock3Answer('')}
              className="rounded-xl flex items-center justify-center shadow-sm border border-gray-200/80 hover:bg-gray-100 active:scale-95 transition-transform w-[3.15rem] h-[3.85rem] sm:w-[3.85rem] sm:h-[4.2rem]"
              style={{ backgroundColor: '#dce8f9' }}
              aria-label="O'chirish"
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: '#7a9fd4' }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                <path d="M21 12H8M8 12l5-5M8 12l5 5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Keyingi topshiriq (Buyumlarni qayta sanash): fon4, начало уже в math_1grade, progress bar
  if (isBuyumlarniNext) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${imageBaseUrl}/fon4.png)` }}
      >
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
            {Array.from({ length: 1 }).map((_, i) => (
              <span key={i} className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0" aria-hidden />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-0" />
      </div>
    );
  }

  // Raketani tuzat: avval начало (intro) — audio + Boshlash; keyin topshiriq (rasm + Tuzat)
  if (isRaketaniTuzat) {
    const handleRaketaniIntroClick = () => {
      raketaniStartAudioRef.current?.pause();
      raketaniStartAudioRef.current = null;
      setRaketaniIntroStarted(true);
    };
    const handleRaketaniBoxClick = (boxIndex: number) => {
      if (raketaniBoxCorrect) return;
      if (boxIndex === raketaniCorrectBoxIndex) {
        setRaketaniBoxCorrect(true);
        try {
          new Audio(`${imageBaseUrl}/correct.mp3`).play().catch(() => {});
        } catch {
          // ignore
        }
        if (raketaniStage < 9) {
          setTimeout(() => {
            setRaketaniStage((s) => s + 1);
            setRaketaniBoxCorrect(false);
            setRaketaniWrongBox(null);
          }, 600);
        } else {
          setTimeout(() => {
            try {
              new Audio(`${imageBaseUrl}/end.mp3`).play().catch(() => {});
            } catch {
              // ignore
            }
            setRaketaniTaskComplete(true);
            if (childId && courseId && lessonSlug) {
              fetch(`/api/child/${childId}/lesson-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, lessonSlug, xp: HP_PER_STAGE * 10 }),
              }).catch(() => {});
            }
          }, 600);
        }
      } else {
        setRaketaniWrongBox(boxIndex);
        try {
          new Audio(`${imageBaseUrl}/wrong.mp3`).play().catch(() => {});
        } catch {
          // ignore
        }
        setTimeout(() => setRaketaniWrongBox(null), 800);
      }
    };
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fonSrc})` }}
      >
        {!raketaniIntroStarted ? (
          <div className="flex-1 min-h-full flex flex-col items-center justify-center relative p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <div className="flex items-center gap-4 opacity-30 blur-md scale-90">
                <span className="text-lg text-gray-200">Raketani tuzat</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRaketaniIntroClick}
              className="relative z-10 px-10 py-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex flex-row items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
              aria-label="Boshlash"
            >
              <span className="text-4xl leading-none">▶</span>
              <span className="text-2xl sm:text-3xl font-bold">Boshlash</span>
            </button>
          </div>
        ) : raketaniTaskComplete ? (
          <div className="flex flex-col h-full items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="text-center max-w-md">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow mb-6">
                Tabriklaymiz!
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 drop-shadow mb-10">
                +{HP_PER_STAGE * 10}
              </p>
              <button
                type="button"
                onClick={() => onComplete?.()}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-md"
              >
                Davom etish
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
              <button
                type="button"
                onClick={onBack}
                className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
                aria-label="Orqaga"
              >
                <span className="text-2xl leading-none font-bold">←</span>
              </button>
              <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
                {raketaniStage > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${(raketaniStage / 9) * 100}%` }}
                    aria-hidden
                  />
                )}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <span key={i} className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0" aria-hidden />
                ))}
              </div>
              <div className="w-10 shrink-0" />
            </header>
            <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-20 sm:bottom-24 z-10 flex flex-col items-center px-4 overflow-y-auto pt-4">
              <div className="flex items-center justify-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAudioClick}
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-all duration-200 ease-out active:scale-90 ${
                    audioPressed ? 'bg-white/60' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label="Ovoz"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
                <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold text-center drop-shadow">
                  {raketaniPrompt}
                </p>
              </div>
              <div className="flex-1 min-h-0 flex items-center justify-center w-full">
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                {Array.from({ length: raketaniBoxCount }).map((_, i) => {
                  const isWrong = raketaniWrongBox === i;
                  const isCorrect = raketaniBoxCorrect && i === raketaniCorrectBoxIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleRaketaniBoxClick(i)}
                      disabled={raketaniBoxCorrect}
                      className={`w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-xl border-2 flex items-center justify-center p-2 overflow-hidden transition-all duration-300 bg-amber-100 border-amber-600 shadow-lg ${
                        isWrong ? 'opacity-50 ring-2 ring-red-400' : isCorrect ? 'scale-110 ring-2 ring-green-500 bg-green-100 border-green-600' : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      <div className="flex flex-wrap justify-center items-center gap-0.5 sm:gap-1 min-w-0 min-h-0 max-w-full max-h-full">
                        {Array.from({ length: raketaniAppleCounts[i] }).map((_, j) => (
                          <Image
                            key={j}
                            src={`${imageBaseUrl}/apple.png`}
                            alt=""
                            width={56}
                            height={56}
                            className="w-11 h-11 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain shrink-0"
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Sayyorani tadqiq qil: fon, orqaga, progress bar; matn; 5 kvadrat; 3 yumaloq tugma
  if (isSayyorani) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fonSrc})` }}
      >
        {sayyoraniComplete ? (
          <div className="flex flex-col h-full items-center justify-center p-6 sm:p-8 overflow-y-auto">
            <div className="text-center max-w-md">
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow mb-6">
                Tabriklaymiz!
              </p>
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 drop-shadow mb-10">
                +{sayyoraniXp}
              </p>
              <button
                type="button"
                onClick={() => onComplete?.()}
                className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-md"
              >
                Davom etish
                <span className="text-2xl">→</span>
              </button>
            </div>
          </div>
        ) : (
        <>
        <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
            aria-label="Orqaga"
          >
            <span className="text-2xl leading-none font-bold">←</span>
          </button>
          <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
            {sayyoraniProgress > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${sayyoraniProgress * 100}%` }}
                aria-hidden
              />
            )}
            {Array.from({ length: SAYYORANI_STAGES.length }).map((_, i) => (
              <span
                key={i}
                className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0"
                aria-hidden
              />
            ))}
          </div>
          <div className="w-10 shrink-0" />
        </header>
        <div className="absolute left-0 right-0 top-14 sm:top-16 bottom-20 sm:bottom-24 z-10 flex flex-col px-4 pt-[1cm] gap-[1.5cm]">
          <div className="flex items-center justify-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAudioClick}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-all duration-200 ease-out active:scale-90 ${
                audioPressed ? 'bg-white/60' : 'bg-white/20 hover:bg-white/30'
              }`}
              aria-label="Ovoz"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            </button>
            <p className="text-white text-2xl sm:text-3xl md:text-4xl font-bold text-center drop-shadow">
              {isSayyoraniFindNumber || isSayyoraniCountPeople || isSayyoraniChooseTaller || isSayyoraniSortOrder ? sayyoraniData.label : 'Tushirib qoldirilgan sonni tanlang'}
            </p>
          </div>
          {sayyoraniData.type === 'squares' && (
            <>
              {/* 5 ta kvadrat */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 shrink-0">
                {sayyoraniData.squares.map((val, i) => (
                  <div
                    key={i}
                    className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-xl bg-amber-100 border-2 border-amber-600 flex items-center justify-center shadow-xl"
                  >
                    <span className={`text-4xl sm:text-5xl md:text-6xl font-bold ${val === '?' ? 'text-sky-600' : 'text-amber-900'}`}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
              {/* 3 ta yumaloq javob */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap shrink-0">
                {sayyoraniOptions.map((num, index) => {
                  const isWrong = wrongIndices.has(index) || (correctSelected && index !== sayyoraniCorrectIndex);
                  const isCorrect = correctSelected && index === sayyoraniCorrectIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSayyoraniAnswer(index)}
                      disabled={wrongIndices.has(index) || correctSelected}
                      className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full font-bold text-4xl sm:text-5xl md:text-6xl text-sky-900 bg-sky-100 border-2 border-sky-600 shadow-lg transition-all duration-300 ${
                        isWrong ? 'opacity-50 cursor-default' : isCorrect ? 'scale-110 ring-2 ring-green-500' : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {sayyoraniData.type === 'findNumber' && sayyoraniFindNumberOrder.length > 0 && (
            <div className="relative flex-1 min-h-[12rem] w-full max-w-2xl mx-auto">
              <div className="absolute inset-0 grid grid-cols-2 gap-4 sm:gap-6 place-items-center" style={{ gridTemplateAreas: '"a b" "c d"' }}>
                {sayyoraniFindNumberOrder.map((num, index) => {
                  const isWrong = wrongIndices.has(index) || (correctSelected && index !== sayyoraniCorrectIndex);
                  const isCorrect = correctSelected && index === sayyoraniCorrectIndex;
                  const positions: { gridArea: string; transform?: string }[] = [
                    { gridArea: 'a', transform: 'translate(-10%, -5%)' },
                    { gridArea: 'b', transform: 'translate(15%, 10%)' },
                    { gridArea: 'c', transform: 'translate(5%, -10%)' },
                    { gridArea: 'd', transform: 'translate(-15%, 5%)' },
                  ];
                  const pos = positions[index];
                  return (
                    <button
                      key={`${num}-${index}`}
                      type="button"
                      onClick={() => handleSayyoraniAnswer(index)}
                      disabled={wrongIndices.has(index) || correctSelected}
                      className={`w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-xl bg-transparent border-none flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                        isWrong ? 'opacity-50 cursor-default' : isCorrect ? 'scale-110 ring-2 ring-green-500' : 'hover:scale-105 active:scale-95'
                      }`}
                      style={{ gridArea: pos.gridArea, transform: pos.transform }}
                    >
                      <Image src={`${imageBaseUrl}/${num}.svg`} alt={`${num}`} width={80} height={80} className="w-full h-full object-contain p-1" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {sayyoraniData.type === 'countPeople' && (
            <>
              <div className="flex items-center justify-center gap-3 sm:gap-4 shrink-0 flex-wrap">
                {sayyoraniData.heroes.map((name) => (
                  <div key={name} className="w-28 h-32 sm:w-40 sm:h-48 md:w-48 md:h-56 rounded-xl overflow-hidden flex-shrink-0 bg-transparent">
                    <Image
                      src={`${imageBaseUrl}/${name}.png`}
                      alt={name}
                      width={192}
                      height={224}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap shrink-0">
                {[1, 2, 3, 4, 5].map((num, index) => {
                  const isWrong = wrongIndices.has(index) || (correctSelected && index !== sayyoraniCorrectIndex);
                  const isCorrect = correctSelected && index === sayyoraniCorrectIndex;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSayyoraniAnswer(index)}
                      disabled={wrongIndices.has(index) || correctSelected}
                      className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl font-bold text-2xl sm:text-3xl text-sky-900 bg-amber-100 border-2 border-amber-600 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isWrong ? 'opacity-50 cursor-default' : isCorrect ? 'scale-110 ring-2 ring-green-500' : 'hover:scale-105 active:scale-95'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {sayyoraniData.type === 'chooseTaller' && (
            <div className="flex items-end justify-center gap-4 sm:gap-6 shrink-0 flex-wrap">
              {sayyoraniData.heroes.map((name, index) => {
                const isWrong = wrongIndices.has(index) || (correctSelected && index !== sayyoraniCorrectIndex);
                const isCorrect = correctSelected && index === sayyoraniCorrectIndex;
                const isTall = index === sayyoraniCorrectIndex;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSayyoraniAnswer(index)}
                    disabled={wrongIndices.has(index) || correctSelected}
                    className={`rounded-xl overflow-hidden flex-shrink-0 bg-transparent border-none transition-all duration-300 ${
                      isWrong ? 'opacity-50 cursor-default' : isCorrect ? 'ring-2 ring-green-500' : 'hover:scale-105 active:scale-95'
                    } ${isTall ? 'w-[12.6rem] h-[16.2rem] sm:w-[16.2rem] sm:h-[19.8rem] md:w-[18rem] md:h-[21.6rem]' : 'w-[10.5rem] h-[13.5rem] sm:w-[13.5rem] sm:h-[16.5rem] md:w-[15rem] md:h-[18rem]'}`}
                  >
                    <Image
                      src={`${imageBaseUrl}/${name}.png`}
                      alt={name}
                      width={isTall ? 192 : 160}
                      height={isTall ? 224 : 192}
                      className="w-full h-full object-contain object-bottom"
                    />
                  </button>
                );
              })}
            </div>
          )}
          {sayyoraniData.type === 'sortOrder' && sayyoraniData.imageKeys.length === 4 && (
            <>
              <div className={`flex items-center justify-center shrink-0 flex-nowrap ${correctSelected ? 'gap-0' : 'gap-[10px]'}`}>
                {sortOrder.map((imageIndex, slotIndex) => {
                  const isSwapFrom = swapAnimation?.from === slotIndex;
                  const isSwapTo = swapAnimation?.to === slotIndex;
                  const swapDelta = swapAnimation && (isSwapFrom || isSwapTo)
                    ? isSwapFrom
                      ? { x: swapAnimation.toLeft - swapAnimation.fromLeft, y: swapAnimation.toTop - swapAnimation.fromTop }
                      : { x: swapAnimation.fromLeft - swapAnimation.toLeft, y: swapAnimation.fromTop - swapAnimation.toTop }
                    : null;
                  const scale = sortSelectedSlot === slotIndex ? 0.95 : 1;
                  const translatePart = swapDelta && !swapAnimating
                    ? `translate(${swapDelta.x}px, ${swapDelta.y}px)`
                    : 'translate(0, 0)';
                  const transform = `scale(${scale}) ${translatePart}`;
                  return (
                    <div
                      key={slotIndex}
                      ref={(el) => { sortSlotRefs.current[slotIndex] = el; }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSortSlotClick(slotIndex)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSortSlotClick(slotIndex); } }}
                      className={`h-40 sm:h-48 md:h-56 w-auto min-w-[4rem] flex-shrink-0 flex items-center justify-center select-none rounded-none overflow-visible
                        ${sortSelectedSlot === slotIndex ? 'ring-2 ring-amber-400 ring-inset' : ''}
                        cursor-pointer ${correctSelected ? 'cursor-default' : ''}`}
                    >
                      <div
                        className="h-full flex items-center justify-center pointer-events-none"
                        style={{
                          transform,
                          transition: swapAnimation && (isSwapFrom || isSwapTo) ? 'transform 0.35s ease-out' : 'transform 0.2s ease-out',
                        }}
                        onTransitionEnd={isSwapFrom || isSwapTo ? handleSwapTransitionEnd : undefined}
                      >
                        <Image
                          src={`${imageBaseUrl}/${sayyoraniData.imageKeys[imageIndex]}.svg`}
                          alt=""
                          width={224}
                          height={224}
                          className="h-full w-auto max-w-none object-contain object-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleSortOrderReady}
                disabled={correctSelected}
                className="shrink-0 self-center w-max max-w-[4cm] px-6 py-2.5 rounded-xl font-bold text-lg text-white bg-sky-600 hover:bg-sky-700 active:scale-95 transition-all disabled:opacity-70"
              >
                Tayyor
              </button>
            </>
          )}
        </div>
        </>
        )}
      </div>
    );
  }

  const stageConfig = STAGES[stage];
  const answerOptions = stageConfig.answerOptions;
  const correctIndex = stageConfig.correctIndex;
  const isWords = isWordsStage(stageConfig);
  const isStarStone = isStarStoneStage(stageConfig);
  const isStarStoneMiddle = isStarStoneMiddleStage(stageConfig);
  const isShapes = isShapesStage(stageConfig);
  const starStoneHorizontal = isStarStone && stage >= 7; // 7,8,9-etap: chap/o'ng
  const starStoneWideGap = isStarStone && (stage === 7 || stage === 8); // 8,9-etap: bir xil 3 cm oraliq
  const sweetsSrc = !isWords && !isStarStone && !isStarStoneMiddle && !isShapes && 'sweetsImage' in stageConfig ? `${imageBaseUrl}/${stageConfig.sweetsImage}` : '';
  const shapesOrder: (keyof typeof SHAPE_SVG)[] = isShapes && 'shapes' in stageConfig && Array.isArray((stageConfig as unknown as { shapes?: unknown }).shapes)
    ? [...(stageConfig as unknown as { shapes: readonly (keyof typeof SHAPE_SVG)[] }).shapes]
    : ['square', 'parallelogram', 'pentagon', 'rhombus'];
  const shapesPrompt = isShapes && (correctIndex === 0 && shapesOrder[0] === 'square' ? 'Kvadratni tanla.' : shapesOrder[correctIndex] === 'triangle' ? "Uchburchakni tanla." : "Kvadratni tanla.");
  const knopkaSrc = isWords ? `${imageBaseUrl}/knopka_etap3.png` : `${imageBaseUrl}/knopka.png`;
  const starSrc = `${imageBaseUrl}/star.png`;
  const stoneSrc = `${imageBaseUrl}/stone.png`;

  const playCorrectAudio = () => {
    try {
      const audio = new Audio(`${imageBaseUrl}/correct.mp3`);
      audio.play().catch(() => {});
    } catch {
      // fayl bo‘lmasa ovoz chiqmaydi
    }
  };

  const playWrongAudio = () => {
    try {
      const audio = new Audio(`${imageBaseUrl}/wrong.mp3`);
      audio.play().catch(() => {});
    } catch {
      // fayl bo‘lmasa ovoz chiqmaydi
    }
  };

  const handleAnswerClick = (index: number) => {
    if (index === correctIndex) {
      setCorrectSelected(true);
      playCorrectAudio();
      const isLastStage = stage === STAGES.length - 1;
      if (isLastStage) {
        setCompletedSteps((s) => s + 1);
        return;
      }
      setTimeout(() => {
        setStage((s) => s + 1);
        setWrongIndices(new Set());
        setCorrectSelected(false);
        setCompletedSteps((s) => s + 1);
      }, 500);
      return;
    }
    setWrongIndices((prev) => new Set(prev).add(index));
    playWrongAudio();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${fonSrc})` }}
    >
      {/* Ekran tugashi: barcha bosqichlar bajarilganda */}
      {allComplete ? (
        <div className="flex flex-col h-full items-center justify-center p-6 sm:p-8 overflow-y-auto">
          <div className="text-center max-w-md">
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow mb-6">
              Tabriklaymiz!
            </p>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-300 drop-shadow mb-10">
              +{totalXp}
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl sm:text-2xl transition-colors shadow-md"
            >
              Davom etish
              <span className="text-2xl">→</span>
            </button>
          </div>
        </div>
      ) : (
        <>
      {/* Yuqori bar — bir xil rangdagi to'rtburchak */}
      <header className="absolute left-0 right-0 top-0 z-10 flex h-14 sm:h-16 items-center justify-between gap-3 px-3 sm:px-4" style={{ backgroundColor: 'rgba(30, 58, 138, 0.9)' }}>
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 shrink-0 rounded-full bg-transparent flex items-center justify-center text-white hover:bg-white/10"
          aria-label="Orqaga"
        >
          <span className="text-2xl leading-none font-bold">←</span>
        </button>
        {/* Nuqtalar — barcha bosqichlar */}
        <div className="relative flex flex-1 max-w-[30rem] sm:max-w-[36rem] rounded-full items-center justify-between bg-white/20 h-[1.8rem] sm:h-[2.1rem] px-2 sm:px-3 overflow-hidden">
          {(completedSteps > 0 || correctSelected) && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${((completedSteps + (correctSelected && stage < STAGES.length - 1 ? 1 : 0)) / STAGES.length) * 100}%` }}
              aria-hidden
            />
          )}
          {Array.from({ length: STAGES.length }).map((_, i) => (
            <span
              key={i}
              className="relative z-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/70 shrink-0"
              aria-hidden
            />
          ))}
        </div>
        <div className="w-10 shrink-0" />
      </header>

      {/* Matn va ramka: matn va yulduz/tosh bloklari aralashmasin */}
      <div
        className={`absolute left-0 right-0 top-14 sm:top-16 bottom-20 sm:bottom-24 z-10 flex flex-col px-4 ${isShortHeight ? 'pt-2' : 'pt-[1cm]'} ${isShortHeight ? 'gap-2' : (isStarStone || isStarStoneMiddle || isShapes ? 'gap-[2.5cm]' : 'gap-[1cm]')}`}
        style={contentScale < 1 ? { transform: `scale(${contentScale})`, transformOrigin: 'top center' } : undefined}
      >
        <div className="flex items-center justify-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAudioClick}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white transition-all duration-200 ease-out active:scale-90 ${
              audioPressed ? 'bg-white/60' : 'bg-white/20 hover:bg-white/30'
            }`}
            aria-label="Ovoz"
          >
            <svg className="w-5 h-5 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>
          <p className={`text-white font-bold text-center drop-shadow ${isShortHeight ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl md:text-4xl'}`}>
            {isShapes ? shapesPrompt : isStarStoneMiddle ? "O'rtadagi yulduzni tanla." : isStarStone ? (starStoneHorizontal ? (correctIndex === 0 ? "Toshdan CHAPDA joylashgan yulduzni tanla." : "Toshdan O'NGDA joylashgan yulduzni tanla.") : (correctIndex === 0 ? "Toshdan YUQORIDA joylashgan yulduzni tanla." : "Toshdan QUYIDA joylashgan yulduzni tanla.")) : isWords ? 'Mos keluvchi raqamlar ketma-ketligini tanlang.' : 'Nechta shirinlik bor? Raqamni tanlang.'}
          </p>
        </div>
        {/* 6–10: yulduz/tosh. 11-etap: 4 geometrik figura — kvadratni tanlang */}
        {isShapes ? (
          <div className="flex-1 min-h-[260px] sm:min-h-[300px] flex items-center justify-center min-w-0 px-4">
            <div className="grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4 place-items-center w-[280px] sm:w-[320px] md:w-[360px]">
              {/* top */}
              <div className="col-start-2 row-start-1">
                <ShapeButton index={0} correctIndex={correctIndex} wrongIndices={wrongIndices} correctSelected={correctSelected} onAnswer={handleAnswerClick} shape={shapesOrder[0]} />
              </div>
              {/* left */}
              <div className="col-start-1 row-start-2">
                <ShapeButton index={1} correctIndex={correctIndex} wrongIndices={wrongIndices} correctSelected={correctSelected} onAnswer={handleAnswerClick} shape={shapesOrder[1]} />
              </div>
              {/* right */}
              <div className="col-start-3 row-start-2">
                <ShapeButton index={2} correctIndex={correctIndex} wrongIndices={wrongIndices} correctSelected={correctSelected} onAnswer={handleAnswerClick} shape={shapesOrder[2]} />
              </div>
              {/* bottom */}
              <div className="col-start-2 row-start-3">
                <ShapeButton index={3} correctIndex={correctIndex} wrongIndices={wrongIndices} correctSelected={correctSelected} onAnswer={handleAnswerClick} shape={shapesOrder[3]} />
              </div>
            </div>
          </div>
        ) : isStarStoneMiddle ? (
          <div className="flex-1 min-h-[240px] sm:min-h-[280px] flex flex-col items-center justify-center gap-3 sm:gap-4 min-w-0 px-4">
            <div className="relative z-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 overflow-visible scale-[2.5] origin-center">
              <Image src={stoneSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 8rem, 9rem" />
            </div>
            <button
              type="button"
              onClick={() => handleAnswerClick(0)}
              disabled={wrongIndices.has(0) || correctSelected}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 shrink-0 overflow-hidden transition-all duration-300 ${(wrongIndices.has(0) || (correctSelected && correctIndex !== 0)) ? 'opacity-50' : correctSelected && correctIndex === 0 ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
            >
              <Image src={starSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 9rem, 10rem" />
            </button>
            <div className="relative z-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 overflow-visible scale-[2.5] origin-center">
              <Image src={stoneSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 8rem, 9rem" />
            </div>
            <button
              type="button"
              onClick={() => handleAnswerClick(1)}
              disabled={wrongIndices.has(1) || correctSelected}
              className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 shrink-0 overflow-hidden transition-all duration-300 ${(wrongIndices.has(1) || (correctSelected && correctIndex !== 1)) ? 'opacity-50' : correctSelected && correctIndex === 1 ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
            >
              <Image src={starSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 9rem, 10rem" />
            </button>
          </div>
        ) : isStarStone ? (
          starStoneHorizontal ? (
            <div className={`flex-1 min-h-[180px] sm:min-h-[220px] flex flex-row items-center justify-center min-w-0 px-4 ${starStoneWideGap ? 'gap-[3cm]' : 'gap-4 sm:gap-6'}`}>
              <button
                type="button"
                onClick={() => handleAnswerClick(0)}
                disabled={wrongIndices.has(0) || correctSelected}
                className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 shrink-0 overflow-hidden transition-all duration-300 ${(wrongIndices.has(0) || (correctSelected && correctIndex !== 0)) ? 'opacity-50' : correctSelected && correctIndex === 0 ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
              >
                <Image src={starSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 10rem, 11rem" />
              </button>
              <div className="relative z-0 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 shrink-0 overflow-visible scale-[3] origin-center">
                <Image src={stoneSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 9rem, 10rem" />
              </div>
              <button
                type="button"
                onClick={() => handleAnswerClick(1)}
                disabled={wrongIndices.has(1) || correctSelected}
                className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 shrink-0 overflow-hidden transition-all duration-300 ${(wrongIndices.has(1) || (correctSelected && correctIndex !== 1)) ? 'opacity-50' : correctSelected && correctIndex === 1 ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
              >
                <Image src={starSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 10rem, 11rem" />
              </button>
            </div>
          ) : (
            <div className="flex-1 min-h-[180px] sm:min-h-[220px] flex flex-col items-center justify-center gap-4 sm:gap-6 min-w-0 px-4">
              <button
                type="button"
                onClick={() => handleAnswerClick(0)}
                disabled={wrongIndices.has(0) || correctSelected}
                className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 shrink-0 overflow-hidden transition-all duration-300 ${(wrongIndices.has(0) || (correctSelected && correctIndex !== 0)) ? 'opacity-50' : correctSelected && correctIndex === 0 ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
              >
                <Image src={starSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 10rem, 11rem" />
              </button>
              <div className="relative z-0 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 shrink-0 overflow-visible scale-[3] origin-center">
                <Image src={stoneSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 9rem, 10rem" />
              </div>
              <button
                type="button"
                onClick={() => handleAnswerClick(1)}
                disabled={wrongIndices.has(1) || correctSelected}
                className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 shrink-0 overflow-hidden transition-all duration-300 ${(wrongIndices.has(1) || (correctSelected && correctIndex !== 1)) ? 'opacity-50' : correctSelected && correctIndex === 1 ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
              >
                <Image src={starSrc} alt="" fill className="object-contain" unoptimized sizes="(max-width:768px) 10rem, 11rem" />
              </button>
            </div>
          )
        ) : isWords ? (
          <div className={`flex-1 min-h-[180px] sm:min-h-[220px] flex items-center justify-center min-w-0 px-4 relative ${isShortHeight ? 'mt-0' : '-mt-[3.5cm]'}`}>
            <div className="relative w-full max-w-2xl">
              {/* Ovoz tugmasi — to'rtburchakning yuqori chetida, ortasida, yarmi tashqarida */}
              <button
                type="button"
                onClick={handleAudioClick}
                className={`absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 w-[4.5rem] h-[4.5rem] sm:w-[5.25rem] sm:h-[5.25rem] rounded-full flex items-center justify-center text-white transition-all duration-200 ease-out active:scale-90 ${
                  audioPressed ? 'bg-indigo-400/70' : 'bg-indigo-500/40 hover:bg-indigo-500/55'
                }`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                aria-label="Ovoz"
              >
                <svg className="w-9 h-9 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
              <div className="rounded-3xl bg-white/95 shadow-xl px-6 py-8 sm:px-8 sm:py-10 flex items-center justify-center gap-[calc(0.75rem+0.5rem)] sm:gap-[calc(1rem+0.5rem)] pt-14 sm:pt-16">
                {(stageConfig as { words: readonly string[] }).words.map((word, i) => (
                  <span key={i} className="flex items-center gap-[calc(0.75rem+0.5rem)] sm:gap-[calc(1rem+0.5rem)]">
                    <span className={`text-gray-800 font-bold ${isShortHeight ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl md:text-6xl'}`}>{word}</span>
                    {i < (stageConfig as { words: readonly string[] }).words.length - 1 && (
                      <span className={`text-purple-600 font-extrabold select-none ${isShortHeight ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'}`} style={{ lineHeight: 1 }}>|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`relative flex-1 min-h-[180px] sm:min-h-[220px] overflow-visible bg-no-repeat bg-center bg-contain flex items-center justify-center gap-2 sm:gap-4 min-w-0 ${isShortHeight ? 'mt-0' : '-mt-[2.5cm]'}`}
            style={{ backgroundImage: `url(${ramkaSrc})` }}
          >
            <div
              className="relative w-[45%] min-w-0 max-w-full aspect-[4/3] shrink-0 transition-transform duration-300"
              style={{ transform: `translateX(${isShortHeight ? '-0.25rem' : '-1cm'}) scale(${stage === 0 ? 1.1 : 0.65})` }}
            >
              <Image
                src={sweetsSrc}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="flex items-center gap-1 shrink-0 text-white font-bold drop-shadow" style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)', transform: isShortHeight ? 'translate(-0.5rem, 0)' : 'translate(-3cm, -1cm)' }}>
              <span>=</span>
              <span>?</span>
            </span>
          </div>
        )}
      </div>

      {/* Javob tugmalari — 6–10 etapda yo'q (yulduzlar o'zi tugma) */}
      {!isStarStone && !isStarStoneMiddle && !isShapes && (
      <div
        className="absolute left-0 right-0 bottom-4 sm:bottom-6 z-10 flex items-center justify-center gap-4 sm:gap-6 px-4"
        style={{ transform: isWords && isShortHeight ? 'translateY(0)' : (isWords ? 'translateY(-1.5cm)' : 'translateY(0.5cm)') }}
      >
        {answerOptions.map((num, index) => {
          const isWrong = wrongIndices.has(index) || (correctSelected && index !== correctIndex);
          const isCorrectAndSelected = index === correctIndex && correctSelected;
          const wrongIndicesOrdered = [0, 1, 2].filter((i) => i !== correctIndex);
          const threeNumbers = isWords
            ? hasButtonTriples(stageConfig)
              ? stageConfig.buttonTriples[index]
              : index === correctIndex
                ? [answerOptions[index], answerOptions[(index + 1) % 3], answerOptions[(index + 2) % 3]]
                : wrongTriplesStage3[wrongIndicesOrdered.indexOf(index)]
            : null;
          const buttonLabel = !isWords ? String(num) : null;
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleAnswerClick(index)}
              disabled={isWrong || correctSelected}
              className={`relative font-bold text-5xl sm:text-6xl md:text-7xl text-blue-900 flex items-center justify-center overflow-hidden bg-no-repeat shadow-lg transition-all duration-300 ${
                isWords
                  ? isShortHeight
                    ? 'w-52 h-36 sm:w-56 sm:h-40 rounded-xl bg-contain bg-center'
                    : 'w-72 h-48 sm:w-[21rem] sm:h-[13.5rem] md:w-96 md:h-60 rounded-xl bg-contain bg-center'
                  : 'w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full bg-cover bg-center'
              } ${isWrong ? 'opacity-50 cursor-default' : isCorrectAndSelected ? 'scale-[1.25]' : 'hover:scale-105 active:scale-95'}`}
              style={{ backgroundImage: `url(${knopkaSrc})` }}
            >
              {isWords && threeNumbers ? (
                <span className="relative z-10 drop-shadow-sm flex w-full justify-evenly px-4" style={{ transform: 'translateY(calc(-0.5rem - 0.5cm + 10px))' }}>
                  {threeNumbers.map((n, i) => (
                    <span key={i}>{n}</span>
                  ))}
                </span>
              ) : (
                <span className="relative z-10 drop-shadow-sm" style={{ transform: 'translateY(calc(-0.5rem - 0.5cm + 10px))' }}>{buttonLabel}</span>
              )}
            </button>
          );
        })}
      </div>
      )}
        </>
      )}
    </div>
  );
}
