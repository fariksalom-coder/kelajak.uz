export type GameMode = 'qoshish' | 'ayirish' | 'kopaytirish' | 'bolish' | 'multy';

export type Level = 1 | 2 | 3 | 4;

export interface Task {
  question: string;
  correct: number;
  options: number[];
}

export interface GameState {
  score: number;
  currentTaskIndex: number;
  currentRound: number;
  mode: GameMode;
  tasks: Task[];
  lives?: number;
}

export const ROUNDS_COUNT = 5;
export const TASKS_PER_ROUND = 5;
export const TOTAL_TASKS = ROUNDS_COUNT * TASKS_PER_ROUND;
