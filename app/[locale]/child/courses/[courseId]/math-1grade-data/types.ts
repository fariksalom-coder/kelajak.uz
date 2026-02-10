// 3 xil holat: locked = blok, current = ochiq, completed = yechilgan
export type LessonStatus = 'completed' | 'current' | 'locked';

export type LessonItem = { label: string; status: LessonStatus };

export type SectionData = {
  sectionTitle: string;
  subsectionTitle?: string;
  lessons: LessonItem[];
};
