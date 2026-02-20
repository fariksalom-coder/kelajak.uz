'use client';

import type { Task } from './types';

const CARD_CLASS =
  'rounded-2xl border-2 border-white/80 bg-white/95 shadow-xl flex items-center justify-center font-bold text-gray-800 backdrop-blur-sm';

export function QuestionCard({ question }: { question: string }) {
  return (
    <div
      className={`${CARD_CLASS} leading-tight text-[clamp(1.5rem,9vw,6rem)] max-md:!text-[clamp(0.75rem,4.5vw,3rem)] md:min-w-[140px] md:min-h-[80px] md:px-6 md:py-4 md:!text-[6rem]`}
      style={{
        minWidth: 'clamp(72px, 26vw, 140px)',
        minHeight: 'clamp(48px, 16vw, 80px)',
        padding: 'clamp(0.375rem, 2vw, 1.5rem) clamp(0.5rem, 2.5vw, 1.5rem)',
      }}
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
      className={`${CARD_CLASS} leading-tight transition-all duration-300 md:min-w-[100px] md:min-h-[72px] md:px-5 md:py-3 md:text-[4rem] ${
        flashWrong ? 'bg-red-200 border-red-400' : ''
      } ${highlightCorrect ? '!bg-green-500 !border-green-600 text-white scale-[1.05]' : ''}`}
      style={{
        minWidth: 'clamp(56px, 20vw, 100px)',
        minHeight: 'clamp(44px, 14vw, 72px)',
        padding: 'clamp(0.25rem, 1.5vw, 0.75rem) clamp(0.375rem, 2vw, 1.25rem)',
        fontSize: 'clamp(1.25rem, 7vw, 4rem)',
      }}
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
      className="fixed left-0 top-1/2 z-[6] flex items-center pointer-events-none gap-[calc(clamp(0.5rem,3vw,2rem)+5cm)] md:gap-[calc(1.5rem+4cm)] lg:gap-[calc(1.5rem+8cm)]"
      style={{
        transform: `translateY(-50%) translateX(${cardOffsetX}px)`,
        willChange: 'transform',
      }}
    >
      <QuestionCard question={task.question} />
      <div className="flex flex-col gap-[calc(clamp(0.375rem,2vw,1.5rem)+2cm)] md:gap-[calc(3rem+3cm)] max-md:scale-50 max-md:origin-left">
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
