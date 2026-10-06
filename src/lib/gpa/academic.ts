import type { LetterGrade } from '../flex/grades';
import type { Term, TranscriptSemester } from '../flex/transcript';
import { countsTowardGpa } from './engine';

/** The semester still in progress (has courses graded 'I' or '-'), if any. */
export function inProgressSemester(semesters: TranscriptSemester[]): TranscriptSemester | null {
  const last = semesters.at(-1);
  return last && last.courses.some((c) => !c.nonCredit && (c.grade === 'I' || c.grade === '-')) ? last : null;
}

/** The latest graded attempt of `code` before semester `beforeIndex` — what a repeat would replace. */
export function priorAttempt(
  semesters: TranscriptSemester[],
  beforeIndex: number,
  code: string,
): { term: Term; grade: LetterGrade } | null {
  for (let i = beforeIndex - 1; i >= 0; i--) {
    const hit = semesters[i]!.courses.find((c) => c.code === code && countsTowardGpa(c));
    if (hit) return { term: semesters[i]!.term, grade: hit.grade as LetterGrade };
  }
  return null;
}

/** Latest counted grade per course code across the whole transcript. */
export function countedGrades(semesters: TranscriptSemester[]): Map<string, { grade: LetterGrade; credits: number; name: string; term: Term }> {
  const out = new Map<string, { grade: LetterGrade; credits: number; name: string; term: Term }>();
  for (const sem of semesters) {
    for (const c of sem.courses) {
      if (countsTowardGpa(c)) out.set(c.code, { grade: c.grade as LetterGrade, credits: c.credits, name: c.name, term: sem.term });
    }
  }
  return out;
}

export const fmt2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
