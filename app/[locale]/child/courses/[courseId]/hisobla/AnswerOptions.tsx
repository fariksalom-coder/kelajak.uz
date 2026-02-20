'use client';

import type { Task } from './types';

const CARD_CLASS =
  'rounded-2xl border-2 border-white/80 bg-white/95 shadow-xl flex items-center justify-center font-bold text-gray-800 backdrop-blur-sm';

export function QuestionCard({ question }: { question: string }) {
  return (
    <div
      className={`${CARD_CLASS} min-w-[140px] min-h-[80px] md:min-w-[100px] md:min-h-[60px] px-6 py-4 md:px-3 md:py-2 text-[6rem] md:text-[2.75rem] leading-tight`}
      data-card="question"
    >
      {question}
    </div>
  );
}

export function OptionCard({
  value,
  isCorrect,
  flashWrong,
  highlightCorrect,
  refCallback,
}: {
  value: number;
  isCorrect: boolean;
  flashWrong: boolean;
  highlightCorrect: boolean;
  refCallback?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={refCallback}
      data-value={value}
      data-correct={isCorrect}
      className={`${CARD_CLASS} min-w-[100px] min-h-[72px] md:min-w-[72px] md:min-h-[52px] px-5 py-3 md:px-3 md:py-1.5 text-[4rem] md:text-[2.25rem] leading-tight transition-all duration-300 ${
        flashWrong ? 'bg-red-200 border-red-400' : ''
      } ${highlightCorrect ? '!bg-green-500 !border-green-600 text-white scale-[1.05]' : ''}`}
    >
      {value}
    </div>
  );
}

export interface AnswerOptionsProps {
  task: Task;
  cardOffsetX: number;
  setOptionRef: (i: number, el: HTMLDivElement | null) => void;
  flashWrongIndex: number | null;
  correctOptionIndex: number | null;
}

export function AnswerOptions({
  task,
  cardOffsetX,
  setOptionRef,
  flashWrongIndex,
  correctOptionIndex,
}: AnswerOptionsProps) {
  return (
    <div
      className="fixed left-0 top-1/2 z-[6] flex items-center pointer-events-none gap-[calc(1.5rem+8cm)] md:gap-4"
      style={{
        transform: `translateY(-50%) translateX(${cardOffsetX}px)`,
        willChange: 'transform',
      }}
    >
      <QuestionCard question={task.question} />
      <div className="flex flex-col gap-[calc(3rem+3cm)] md:gap-2">
        {task.options.map((value, i) => (
          <OptionCard
            key={`${task.question}-${i}-${value}`}
            value={value}
            isCorrect={value === task.correct}
            flashWrong={flashWrongIndex === i}
            highlightCorrect={correctOptionIndex === i}
            refCallback={(el) => setOptionRef(i, el)}
          />
        ))}
      </div>
    </div>
  );
}
