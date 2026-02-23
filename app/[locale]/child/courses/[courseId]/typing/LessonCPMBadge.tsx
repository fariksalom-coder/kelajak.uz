'use client';

import { useState, useEffect } from 'react';
import { loadLevelResults, getAverageCPM } from './useTypingStats';

type LessonCPMBadgeProps = {
  lessonSlug: string;
  lessonKeys?: string;
};

export default function LessonCPMBadge({ lessonSlug, lessonKeys }: LessonCPMBadgeProps) {
  const [avgCPM, setAvgCPM] = useState<number | null>(null);

  const isFJLesson = lessonSlug === 'keys-f-j' || lessonKeys === 'fj';
  const isDKLesson = lessonSlug === 'keys-d-k' || lessonKeys === 'dk';
  const isDFJKLesson = lessonSlug === 'keys-d-f-j-k' || lessonKeys === 'dfjk';
  const isSLLesson = lessonSlug === 'keys-s-l' || lessonKeys === 'sl';
  const isGHLesson = lessonSlug === 'keys-g-h' || lessonKeys === 'gh';
  const isHomeRowRepeatLesson = lessonSlug === 'keys-home-row-repeat' || lessonKeys === 'asdfghjkl';
  const isTFYJLesson = lessonSlug === 'keys-tf-yj' || lessonKeys === 'tfyj';
  const isRFUJLesson = lessonSlug === 'keys-rf-uj' || lessonKeys === 'rfuj';
  const isEILesson = lessonSlug === 'keys-e-i' || lessonKeys === 'ei';
  const isWOLesson = lessonSlug === 'keys-w-o' || lessonKeys === 'wo';
  const isQPLesson = lessonSlug === 'keys-q-p' || lessonKeys === 'qp';
  const isVMLesson = lessonSlug === 'keys-v-m' || lessonKeys === 'vm';
  const isBNLesson = lessonSlug === 'keys-b-n' || lessonKeys === 'bn';
  const isCCommaLesson = lessonSlug === 'keys-c-comma' || lessonKeys === 'c,';
  const isXDotLesson = lessonSlug === 'keys-x-dot' || lessonKeys === 'x.';
  const isZSlashLesson = lessonSlug === 'keys-z-slash' || lessonKeys === 'z/';
  const isLeftHandWordsLesson = lessonSlug === 'keys-left-hand-words';
  const isRightHandWordsLesson = lessonSlug === 'keys-right-hand-words';
  const isTakrorlashFullLesson = lessonSlug === 'takrorlash-full';
  const isTopWordsTakrorlashLesson = lessonSlug === 'keys-top-words-takrorlash';
  const isTopHomeRepeatLesson = lessonSlug === 'keys-top-home-repeat' || lessonKeys === 'frtyughj';
  const isASemicolonLesson = lessonSlug === 'keys-a-semicolon' || lessonKeys === 'a;';
  const isLeftHandOnlyLesson = lessonSlug === 'keys-left-hand-only' || lessonKeys === 'asdfg';
  const isRightHandOnlyLesson = lessonSlug === 'keys-right-hand-only' || lessonKeys === 'hjkl;';
  const showBadge = isFJLesson || isDKLesson || isDFJKLesson || isSLLesson || isASemicolonLesson || isGHLesson || isHomeRowRepeatLesson || isLeftHandOnlyLesson || isRightHandOnlyLesson || isTFYJLesson || isRFUJLesson || isEILesson || isWOLesson || isQPLesson || isVMLesson || isBNLesson || isCCommaLesson || isXDotLesson || isZSlashLesson || isLeftHandWordsLesson || isRightHandWordsLesson || isTakrorlashFullLesson || isTopWordsTakrorlashLesson || isTopHomeRepeatLesson;

  useEffect(() => {
    if (!showBadge) return;
    const results = loadLevelResults(lessonSlug);
    const avg = getAverageCPM(results);
    setAvgCPM(results.length > 0 ? avg : null);
  }, [showBadge, lessonSlug]);

  if (!showBadge || avgCPM === null) return null;

  return (
    <span
      className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-sky-100 border border-sky-200 text-sky-700 text-xs font-medium whitespace-nowrap"
      aria-label={`O'rtacha tezlik: ${avgCPM} belgi/min`}
    >
      {avgCPM} belgi/min
    </span>
  );
}
