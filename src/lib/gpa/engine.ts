import { GRADE_POINTS, isLetterGrade, isPassing, type Grade, type LetterGrade } from '../flex/grades';
import type { CourseAttempt, Term, TranscriptSemester } from '../flex/transcript';

export interface GpaRules {
  /** Which attempt of a repeated course counts toward CGPA. FAST counts the latest. */
  repeatPolicy: 'latest' | 'best';
}

export const DEFAULT_RULES: GpaRules = { repeatPolicy: 'latest' };

export interface Replacement {
  code: string;
  name: string;
  credits: number;
  previous: { term: Term; grade: LetterGrade };
  current: { term: Term; grade: LetterGrade };
}

export interface SemesterStanding {
  term: Term;
  sgpa: number;
  cgpa: number;
  /** Credits counting toward CGPA after this semester (repeats counted once). */
  creditsAttempted: number;
  /** Of those, credits with a passing grade. */
  creditsEarned: number;
  /** Credits of letter-graded courses taken this semester. */
  semesterCredits: number;
  /** Earlier attempts this semester's courses replaced. */
  replacements: Replacement[];
}

interface CountedAttempt {
  term: Term;
  attempt: CourseAttempt;
  grade: LetterGrade;
}

/** True when an attempt carries grade points: letter-graded and not a non-credit course. */
export function countsTowardGpa(attempt: CourseAttempt): boolean {
  return !attempt.nonCredit && isLetterGrade(attempt.grade);
}

/**
 * Replays the transcript in order and computes SGPA/CGPA per semester the way
 * Flex does: SGPA covers every graded course of the semester (repeats
 * included); CGPA keeps one attempt per course code, chosen by `repeatPolicy`.
 * W, I, S, U and ungraded attempts never count and never replace a grade.
 */
export function computeStandings(
  semesters: TranscriptSemester[],
  rules: GpaRules = DEFAULT_RULES,
): SemesterStanding[] {
  const counted = new Map<string, CountedAttempt>();
  const standings: SemesterStanding[] = [];

  for (const { term, courses } of semesters) {
    let semCredits = 0;
    let semPoints = 0;
    const replacements: Replacement[] = [];

    for (const attempt of courses) {
      if (!countsTowardGpa(attempt)) continue;
      const grade = attempt.grade as LetterGrade;
      semCredits += attempt.credits;
      semPoints += attempt.credits * GRADE_POINTS[grade];

      const prior = counted.get(attempt.code);
      if (prior && rules.repeatPolicy === 'best' && GRADE_POINTS[prior.grade] >= GRADE_POINTS[grade]) continue;
      if (prior) {
        replacements.push({
          code: attempt.code,
          name: attempt.name,
          credits: attempt.credits,
          previous: { term: prior.term, grade: prior.grade },
          current: { term, grade },
        });
      }
      counted.set(attempt.code, { term, attempt, grade });
    }

    let totalCredits = 0;
    let totalPoints = 0;
    let earned = 0;
    for (const { attempt, grade } of counted.values()) {
      totalCredits += attempt.credits;
      totalPoints += attempt.credits * GRADE_POINTS[grade];
      if (isPassing(grade)) earned += attempt.credits;
    }

    standings.push({
      term,
      sgpa: semCredits ? semPoints / semCredits : 0,
      cgpa: totalCredits ? totalPoints / totalCredits : 0,
      creditsAttempted: totalCredits,
      creditsEarned: earned,
      semesterCredits: semCredits,
      replacements,
    });
  }

  return standings;
}

/** Hypothetical grade for one attempt, keyed by `attemptKey(term, code)`. */
export type GradeOverrides = Record<string, Grade>;

export function attemptKey(term: Term, code: string): string {
  return `${term.label}|${code}`;
}

/** Returns a copy of the transcript with what-if grades applied (e.g. 'B+' or 'W' for an in-progress course). */
export function applyOverrides(semesters: TranscriptSemester[], overrides: GradeOverrides): TranscriptSemester[] {
  return semesters.map((sem) => ({
    ...sem,
    courses: sem.courses.map((c) => {
      const grade = overrides[attemptKey(sem.term, c.code)];
      return grade ? { ...c, grade } : c;
    }),
  }));
}

export interface StatsMismatch {
  term: Term;
  field: 'sgpa' | 'cgpa' | 'creditsAttempted' | 'creditsEarned';
  flex: number;
  ours: number;
}

/**
 * Compares our replay against the totals Flex prints. Any mismatch means a rule
 * we don't model yet (e.g. a renamed course code), and the UI should say so
 * instead of showing a silently wrong CGPA.
 */
export function verifyAgainstFlex(semesters: TranscriptSemester[], standings: SemesterStanding[]): StatsMismatch[] {
  const mismatches: StatsMismatch[] = [];
  semesters.forEach((sem, i) => {
    const flex = sem.flexStats;
    const ours = standings[i];
    if (!flex || !ours) return;
    for (const field of ['sgpa', 'cgpa', 'creditsAttempted', 'creditsEarned'] as const) {
      if (Math.abs(round2(ours[field]) - flex[field]) > 0.011) {
        mismatches.push({ term: sem.term, field, flex: flex[field], ours: ours[field] });
      }
    }
  });
  return mismatches;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
