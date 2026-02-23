/** Lesson type for touch typing course (kids 7–14) */
export type TypingLessonType =
  | 'learn'      // study new keys
  | 'repeat'     // review
  | 'practice'   // typing drill
  | 'game'       // mini-game
  | 'theory';    // short tip (posture, breaks, etc.)

export type TypingExercise = {
  type: 'typing';
  text: string;
} | {
  type: 'game';
  gameId: string;
  rules: string;
  targetKeys?: string;
};

export type TypingLessonData = {
  slug: string;
  title: string;
  lessonType: TypingLessonType;
  explanation: string;
  exercises: TypingExercise[];
  /** Optional: keys this lesson focuses on (e.g. "fj", "dk") */
  keys?: string;
  /** Optional: video URL for intro/video lessons. If empty or missing, shows placeholder. */
  videoUrl?: string;
};

export type TypingSection = {
  sectionTitle: string;
  sectionId: string;
  lessons: TypingLessonData[];
};
