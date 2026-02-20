/**
 * Сохранение и загрузка прогресса по режимам (сложение, вычитание и т.д.)
 */

const STORAGE_KEY = 'mathGameProgress';

export interface AdditionProgress {
  unlockedLevel: number;
  lastPlayedLevel: number;
  score: number;
}

export interface SubtractionProgress {
  unlockedLevel: number;
  lastPlayedLevel: number;
  score: number;
}

export interface MultiplicationProgress {
  unlockedLevel: number;
  lastPlayedLevel: number;
  score: number;
}

export interface DivisionProgress {
  unlockedLevel: number;
  lastPlayedLevel: number;
  score: number;
}

export interface MultyProgress {
  unlockedLevel: number;
  lastPlayedLevel: number;
  score: number;
}

export interface MathGameProgress {
  addition: AdditionProgress;
  subtraction: SubtractionProgress;
  multiplication: MultiplicationProgress;
  division: DivisionProgress;
  multy: MultyProgress;
}

const defaultAddition: AdditionProgress = {
  unlockedLevel: 1,
  lastPlayedLevel: 1,
  score: 0,
};

const defaultSubtraction: SubtractionProgress = {
  unlockedLevel: 1,
  lastPlayedLevel: 1,
  score: 0,
};

const defaultMultiplication: MultiplicationProgress = {
  unlockedLevel: 1,
  lastPlayedLevel: 1,
  score: 0,
};

const defaultDivision: DivisionProgress = {
  unlockedLevel: 1,
  lastPlayedLevel: 1,
  score: 0,
};

const defaultMulty: MultyProgress = {
  unlockedLevel: 1,
  lastPlayedLevel: 1,
  score: 0,
};

function getDefault(): MathGameProgress {
  return {
    addition: { ...defaultAddition },
    subtraction: { ...defaultSubtraction },
    multiplication: { ...defaultMultiplication },
    division: { ...defaultDivision },
    multy: { ...defaultMulty },
  };
}

export function loadProgress(): MathGameProgress {
  if (typeof window === 'undefined') return getDefault();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const parsed = JSON.parse(raw) as Partial<MathGameProgress>;
    return {
      addition: { ...defaultAddition, ...parsed.addition },
      subtraction: { ...defaultSubtraction, ...parsed.subtraction },
      multiplication: { ...defaultMultiplication, ...parsed.multiplication },
      division: { ...defaultDivision, ...parsed.division },
      multy: { ...defaultMulty, ...parsed.multy },
    };
  } catch {
    return getDefault();
  }
}

export function saveAdditionProgress(progress: Partial<AdditionProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadProgress();
    current.addition = { ...current.addition, ...progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getAdditionProgress(): AdditionProgress {
  return loadProgress().addition;
}

export function saveSubtractionProgress(progress: Partial<SubtractionProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadProgress();
    current.subtraction = { ...current.subtraction, ...progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getSubtractionProgress(): SubtractionProgress {
  return loadProgress().subtraction;
}

export function saveMultiplicationProgress(progress: Partial<MultiplicationProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadProgress();
    current.multiplication = { ...current.multiplication, ...progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getMultiplicationProgress(): MultiplicationProgress {
  return loadProgress().multiplication;
}

export function saveDivisionProgress(progress: Partial<DivisionProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadProgress();
    current.division = { ...current.division, ...progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getDivisionProgress(): DivisionProgress {
  return loadProgress().division;
}

export function saveMultyProgress(progress: Partial<MultyProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadProgress();
    current.multy = { ...current.multy, ...progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function getMultyProgress(): MultyProgress {
  return loadProgress().multy;
}
