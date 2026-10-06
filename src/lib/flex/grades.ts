/** Letter grades that carry grade points and count toward SGPA/CGPA. */
export const GRADE_POINTS = {
  'A+': 4,
  A: 4,
  'A-': 3.67,
  'B+': 3.33,
  B: 3,
  'B-': 2.67,
  'C+': 2.33,
  C: 2,
  'C-': 1.67,
  'D+': 1.33,
  D: 1,
  F: 0,
} as const;

export type LetterGrade = keyof typeof GRADE_POINTS;

/**
 * Non-letter marks seen on Flex:
 * W = withdrawn, I = in progress, S/U = satisfactory/unsatisfactory (non-credit), '-' = not graded yet.
 */
export type SpecialGrade = 'W' | 'I' | 'S' | 'U' | '-';

export type Grade = LetterGrade | SpecialGrade;

/** Letter grades from best to worst; handy for dropdowns and planners. */
export const LETTER_GRADES = Object.keys(GRADE_POINTS) as LetterGrade[];

export function isLetterGrade(grade: string): grade is LetterGrade {
  return grade in GRADE_POINTS;
}

export function normalizeGrade(raw: string): Grade {
  const g = raw.trim().toUpperCase();
  if (isLetterGrade(g)) return g;
  if (g === 'W' || g === 'I' || g === 'S' || g === 'U') return g;
  return '-';
}

/** Grades that mean the course was passed and its credits are earned. */
export function isPassing(grade: Grade): boolean {
  return isLetterGrade(grade) && grade !== 'F';
}
