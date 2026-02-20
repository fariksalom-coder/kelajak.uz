'use client';

import { motion, AnimatePresence } from 'framer-motion';

export interface LevelCompleteModalProps {
  visible: boolean;
  level: number;
  score: number;
  onNext: () => void;
  onRestart: () => void;
  onBack: () => void;
}

export function LevelCompleteModal({
  visible,
  level,
  score,
  onNext,
  onRestart,
  onBack,
}: LevelCompleteModalProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[11] flex items-center justify-center bg-black/50 pointer-events-auto p-4"
          aria-modal
          role="dialog"
          aria-labelledby="level-complete-title"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center"
          >
            <h2 id="level-complete-title" className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Tabriklaymiz!
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-1">
              Siz {level}-darajani muvaffaqiyatli yakunladingiz
            </p>
            <p className="text-xl sm:text-2xl text-sky-600 font-semibold mb-6">
              Sizning natijangiz: {score} ball
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onNext}
                className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg shadow-lg transition-colors active:scale-[0.98]"
              >
                Keyingi daraja
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-lg transition-colors active:scale-[0.98]"
              >
                Qayta urinish
              </button>
              <button
                type="button"
                onClick={onBack}
                className="w-full py-4 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-lg transition-colors active:scale-[0.98]"
              >
                Orqaga
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
