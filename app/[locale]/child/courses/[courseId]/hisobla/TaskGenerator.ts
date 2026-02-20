import type { GameMode, Level, Task } from './types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Генерирует неправильный вариант (не равный correct и не дублирующий существующие) */
function wrongOption(correct: number, existing: number[], level: Level): number {
  const range = level <= 2 ? 12 : level === 3 ? 25 : 50;
  let c = 0;
  while (c < 30) {
    const delta = randInt(-range, range);
    if (delta === 0) continue;
    const opt = correct + delta;
    if (opt >= 0 && opt <= 99 && !existing.includes(opt)) return opt;
    c++;
  }
  return correct + (correct > 5 ? -1 : 1);
}

export function generateTask(level: Level, mode: GameMode): Task {
  let a: number, b: number, correct: number;

  if (mode === 'qoshish') {
    if (level === 1) {
      a = randInt(1, 5);
      b = randInt(1, 5);
      correct = a + b;
    } else if (level === 2) {
      a = randInt(1, 10);
      b = randInt(1, 10);
      correct = a + b;
    } else if (level === 3) {
      a = randInt(10, 30);
      b = randInt(1, 9);
      correct = a + b;
    } else {
      a = randInt(5, 25);
      b = randInt(5, 25);
      correct = a + b;
    }
  } else if (mode === 'ayirish') {
    if (level === 1) {
      a = randInt(2, 5);
      b = randInt(1, a - 1);
      correct = a - b;
    } else if (level === 2) {
      a = randInt(5, 10);
      b = randInt(1, a - 1);
      correct = a - b;
    } else if (level === 3) {
      a = randInt(15, 30);
      b = randInt(1, 9);
      correct = a - b;
    } else {
      a = randInt(10, 25);
      b = randInt(1, Math.min(9, a - 1));
      correct = a - b;
    }
  } else if (mode === 'kopaytirish') {
    if (level === 1) {
      a = randInt(1, 4);
      b = randInt(1, 4);
      correct = a * b;
    } else if (level === 2) {
      a = randInt(1, 5);
      b = randInt(1, 5);
      correct = a * b;
    } else if (level === 3) {
      a = randInt(2, 6);
      b = randInt(2, 6);
      correct = a * b;
    } else {
      a = randInt(2, 9);
      b = randInt(2, 9);
      correct = a * b;
    }
  } else if (mode === 'bolish') {
    if (level === 1) {
      b = randInt(1, 4);
      correct = randInt(1, 4);
      a = b * correct;
    } else if (level === 2) {
      b = randInt(1, 5);
      correct = randInt(1, 5);
      a = b * correct;
    } else if (level === 3) {
      b = randInt(2, 6);
      correct = randInt(2, 6);
      a = b * correct;
    } else {
      b = randInt(2, 9);
      correct = randInt(2, 9);
      a = b * correct;
    }
  } else {
    const modes: GameMode[] = ['qoshish', 'ayirish', 'kopaytirish', 'bolish'];
    return generateTask(level, modes[randInt(0, modes.length - 1)]);
  }

  const sym = mode === 'qoshish' ? '+' : mode === 'ayirish' ? '−' : mode === 'kopaytirish' ? '×' : '÷';
  const questionStr = `${a} ${sym} ${b}`;

  const options: number[] = [correct];
  while (options.length < 3) {
    options.push(wrongOption(correct, options, level));
  }

  return {
    question: questionStr,
    correct,
    options: shuffle(options),
  };
}

export function getSymbol(mode: GameMode): string {
  return mode === 'qoshish' ? '+' : mode === 'ayirish' ? '−' : mode === 'kopaytirish' ? '×' : '÷';
}
