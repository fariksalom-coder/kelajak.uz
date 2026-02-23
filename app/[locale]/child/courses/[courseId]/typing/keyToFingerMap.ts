/**
 * Карта: клавиша → рука и палец.
 * Левая рука: подсчёт с обратной стороны — 0=мизинец, 1=безымянный, 2=средний, 3=указательный, 4=большой.
 * Правая рука: 5=большой, 6=указательный, 7=средний, 8=безымянный, 9=мизинец.
 */
export type Hand = 'left' | 'right' | 'both';
export type Finger = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';

export type KeyToFingerEntry = {
  hand: Hand;
  finger: Finger;
};

const FINGER_INDEX: Record<Hand, Record<Finger, number>> = {
  left: { pinky: 0, ring: 1, middle: 2, index: 3, thumb: 4 },
  right: { thumb: 5, index: 6, middle: 7, ring: 8, pinky: 9 },
  both: { pinky: 0, ring: 1, middle: 2, index: 3, thumb: 4 },
};

/** Клавиша → рука и палец (расширяемая карта) */
export const keyToFingerMap: Record<string, KeyToFingerEntry> = {
  f: { hand: 'left', finger: 'index' },
  g: { hand: 'left', finger: 'index' },
  t: { hand: 'left', finger: 'index' },
  r: { hand: 'left', finger: 'index' },
  j: { hand: 'right', finger: 'index' },
  h: { hand: 'right', finger: 'index' },
  y: { hand: 'right', finger: 'index' },
  u: { hand: 'right', finger: 'index' },
  ' ': { hand: 'both', finger: 'thumb' },
  a: { hand: 'left', finger: 'pinky' },
  s: { hand: 'left', finger: 'ring' },
  d: { hand: 'left', finger: 'middle' },
  e: { hand: 'left', finger: 'middle' },
  k: { hand: 'right', finger: 'middle' },
  i: { hand: 'right', finger: 'middle' },
  l: { hand: 'right', finger: 'ring' },
  o: { hand: 'right', finger: 'ring' },
  ';': { hand: 'right', finger: 'pinky' },
  p: { hand: 'right', finger: 'pinky' },
  q: { hand: 'left', finger: 'pinky' },
  w: { hand: 'left', finger: 'ring' },
  v: { hand: 'left', finger: 'index' },
  m: { hand: 'right', finger: 'index' },
  b: { hand: 'left', finger: 'index' },
  n: { hand: 'right', finger: 'index' },
  c: { hand: 'left', finger: 'middle' },
  ',': { hand: 'right', finger: 'middle' },
  x: { hand: 'left', finger: 'ring' },
  '.': { hand: 'right', finger: 'ring' },
  z: { hand: 'left', finger: 'pinky' },
  '/': { hand: 'right', finger: 'pinky' },
  /** Backspace — подсветка пальца при активном Delete (ошибка) */
  '\b': { hand: 'right', finger: 'pinky' },
};

/** Нормализация символа для поиска в карте (буквы — в нижнем регистре) */
function lookupKey(char: string): KeyToFingerEntry | undefined {
  const key = char.length === 1 && /[a-zA-Z]/.test(char) ? char.toLowerCase() : char;
  return keyToFingerMap[key];
}

/**
 * Возвращает индексы кружков для левой руки (0–4), которые нужно подсветить для currentChar.
 */
export function getLeftHandActiveIndices(currentChar: string | null): number[] {
  if (!currentChar) return [];
  const entry = lookupKey(currentChar);
  if (!entry) return [];
  if (entry.hand === 'right') return [];
  const idx = FINGER_INDEX.left[entry.finger];
  if (entry.hand === 'both') return [idx]; // только левый большой палец (один круг)
  return [idx];
}

/**
 * Возвращает индексы кружков для правой руки (5–9), которые нужно подсветить для currentChar.
 */
export function getRightHandActiveIndices(currentChar: string | null): number[] {
  if (!currentChar) return [];
  const entry = lookupKey(currentChar);
  if (!entry) return [];
  if (entry.hand === 'left') return [];
  const idx = FINGER_INDEX.right[entry.finger];
  // для 'both' (пробел) подсвечиваем только левую руку в getLeftHandActiveIndices — один круг
  if (entry.hand === 'both') return [];
  return [idx];
}
