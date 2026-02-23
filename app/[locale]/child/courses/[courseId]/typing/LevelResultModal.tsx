'use client';

import { getAverageCPM, type LevelResult } from './useTypingStats';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export type LevelResultModalProps = {
  levelIndex: number;
  correct: number;
  errors: number;
  timeSeconds: number;
  cpm: number;
  levelResults: LevelResult[];
  currentResult: LevelResult | null;
  onRepeat: () => void;
  onNextLevel: () => void;
  isLastLevel: boolean;
};

export default function LevelResultModal({
  correct,
  errors,
  timeSeconds,
  cpm,
  levelResults,
  currentResult,
  onRepeat,
  onNextLevel,
  isLastLevel,
}: LevelResultModalProps) {
  const allResults = currentResult
    ? [...levelResults.filter((r) => r.level !== currentResult.level), currentResult]
    : levelResults;
  const avgCPM = getAverageCPM(allResults);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="level-result-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h2 id="level-result-title" className="text-xl font-bold text-gray-800 text-center">
          Уровень завершён
        </h2>
        <div className="space-y-2 text-gray-700">
          <p className="flex justify-between">
            <span>Correct:</span>
            <strong className="text-green-600">{correct}</strong>
          </p>
          <p className="flex justify-between">
            <span>Errors:</span>
            <strong className="text-red-600">{errors}</strong>
          </p>
          <p className="flex justify-between">
            <span>Time:</span>
            <strong>{formatTime(timeSeconds)}</strong>
          </p>
          <p className="flex justify-between">
            <span>Speed:</span>
            <strong>{cpm} символов/мин</strong>
          </p>
          {allResults.length > 0 && (
            <p className="flex justify-between pt-1 border-t border-gray-200">
              <span>Средняя скорость:</span>
              <strong>{avgCPM} CPM</strong>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onRepeat}
            className="w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
          >
            Qayta o‘tish
          </button>
          <button
            type="button"
            onClick={onNextLevel}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium"
          >
            {isLastLevel ? 'Yakunlash' : 'Keyingi daraja'}
          </button>
        </div>
      </div>
    </div>
  );
}
