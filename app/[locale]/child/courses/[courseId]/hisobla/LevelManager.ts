import type { Task } from './types';
import { additionLevels, ADDITION_LEVELS_COUNT, TASKS_PER_LEVEL } from './data/additionLevels';
import { subtractionLevels, SUBTRACTION_LEVELS_COUNT } from './data/subtractionLevels';
import { multiplicationLevels, MULTIPLICATION_LEVELS_COUNT } from './data/multiplicationLevels';
import { divisionLevels, DIVISION_LEVELS_COUNT } from './data/divisionLevels';

export const MULTY_LEVELS_COUNT = 10;

export { ADDITION_LEVELS_COUNT, TASKS_PER_LEVEL, SUBTRACTION_LEVELS_COUNT, MULTIPLICATION_LEVELS_COUNT, DIVISION_LEVELS_COUNT };

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Возвращает задачи уровня сложения в формате GameEngine (Task).
 * Варианты ответа перемешиваются, чтобы правильный не был всегда первым.
 */
export function getAdditionLevelTasks(levelNumber: number): Task[] {
  const level = additionLevels.find((l) => l.level === levelNumber);
  if (!level) return [];
  return level.tasks.map((t) => ({
    question: t.question,
    correct: t.correct,
    options: shuffle(t.options),
  }));
}

export function getAdditionLevel(levelNumber: number) {
  return additionLevels.find((l) => l.level === levelNumber) ?? null;
}

/**
 * Возвращает задачи уровня вычитания в формате GameEngine (Task).
 * Варианты ответа перемешиваются.
 */
export function getSubtractionLevelTasks(levelNumber: number): Task[] {
  const level = subtractionLevels.find((l) => l.level === levelNumber);
  if (!level) return [];
  return level.tasks.map((t) => ({
    question: t.question,
    correct: t.correct,
    options: shuffle(t.options),
  }));
}

/**
 * Возвращает задачи уровня умножения в формате GameEngine (Task).
 * Варианты ответа перемешиваются.
 */
export function getMultiplicationLevelTasks(levelNumber: number): Task[] {
  const level = multiplicationLevels.find((l) => l.level === levelNumber);
  if (!level) return [];
  return level.tasks.map((t) => ({
    question: t.question,
    correct: t.correct,
    options: shuffle(t.options),
  }));
}

/**
 * Возвращает задачи уровня деления в формате GameEngine (Task).
 * Варианты ответа перемешиваются.
 */
export function getDivisionLevelTasks(levelNumber: number): Task[] {
  const level = divisionLevels.find((l) => l.level === levelNumber);
  if (!level) return [];
  return level.tasks.map((t) => ({
    question: t.question,
    correct: t.correct,
    options: shuffle(t.options),
  }));
}

const TASKS_PER_OPERATION_IN_MULTY = 5;

/**
 * Возвращает задачи уровня Multy: по 5 примеров из сложения, вычитания, умножения и деления
 * соответствующего уровня (всего 20 заданий), перемешанные.
 */
export function getMultyLevelTasks(levelNumber: number): Task[] {
  const take = (arr: Task[], n: number) => shuffle([...arr]).slice(0, n);
  const addition = getAdditionLevelTasks(levelNumber);
  const subtraction = getSubtractionLevelTasks(levelNumber);
  const multiplication = getMultiplicationLevelTasks(levelNumber);
  const division = getDivisionLevelTasks(levelNumber);
  const combined = [
    ...take(addition, TASKS_PER_OPERATION_IN_MULTY),
    ...take(subtraction, TASKS_PER_OPERATION_IN_MULTY),
    ...take(multiplication, TASKS_PER_OPERATION_IN_MULTY),
    ...take(division, TASKS_PER_OPERATION_IN_MULTY),
  ];
  return shuffle(combined);
}
