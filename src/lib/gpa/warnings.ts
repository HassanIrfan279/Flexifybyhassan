import { GRADE_POINTS, type LetterGrade } from '../flex/grades';
import type { Term, TranscriptSemester } from '../flex/transcript';
import { countsTowardGpa, DEFAULT_RULES, type GpaRules, type SemesterStanding } from './engine';

export interface WarningRules {
  /** CGPA below this at the end of a semester is a warning (2.00 for BS/BBA). */
  minCgpa: number;
  /** Warning count at which admission is closed. */
  maxWarnings: number;
}

export const DEFAULT_WARNING_RULES: WarningRules = { minCgpa: 2, maxWarnings: 3 };

export interface WarningEvent {
  term: Term;
  cgpa: number;
  /** Count after this semester. */
  count: number;
  change: 'warning' | 'reset' | 'none' | 'skipped';
}

/**
 * Replays warning counts. Summer semesters count like regular ones. A semester
 * with no graded credit (e.g. everything withdrawn) is skipped: the transcript
 * fixture shows a student still enrolled after such a summer at CGPA < 2 with
 * two prior warnings.
 */
export function warningHistory(
  semesters: TranscriptSemester[],
  standings: SemesterStanding[],
  rules: WarningRules = DEFAULT_WARNING_RULES,
): WarningEvent[] {
  let count = 0;
  return standings.map((s, i) => {
    const graded = semesters[i]?.courses.some(countsTowardGpa) ?? false;
    if (!graded) return { term: s.term, cgpa: s.cgpa, count, change: 'skipped' };
    if (s.cgpa < rules.minCgpa - 1e-9) {
      count += 1;
      return { term: s.term, cgpa: s.cgpa, count, change: 'warning' };
    }
    const change = count > 0 ? 'reset' : 'none';
    count = 0;
    return { term: s.term, cgpa: s.cgpa, count, change };
  });
}

/** A current-semester course the planner may assign a grade to. */
export interface PlannerCourse {
  code: string;
  name: string;
  credits: number;
  /** Fixed grade (e.g. the student expects an F, or plans to withdraw); omitted = free. */
  locked?: LetterGrade | 'W';
}

export interface GradePlan {
  grades: Record<string, LetterGrade | 'W'>;
  sgpa: number;
  cgpa: number;
}

export interface WarningPlan {
  /** CGPA if every free course gets an A. */
  bestCaseCgpa: number;
  /** CGPA if every free course gets an F. */
  worstCaseCgpa: number;
  reachable: boolean;
  /** Lowest SGPA over the free courses that reaches the target (null if unreachable). */
  requiredSgpa: number | null;
  /** Lowest single grade that, given to every free course, reaches the target. */
  uniformGrade: LetterGrade | null;
  /** Minimal plans (no grade can be lowered), easiest first. */
  plans: GradePlan[];
}

/**
 * Grade levels the planner may suggest, worst first. A+ equals A, and F is
 * never suggested (it means repeating the course again); a student can still
 * lock an expected F.
 */
const LEVELS: LetterGrade[] = (Object.keys(GRADE_POINTS) as LetterGrade[]).filter((g) => g !== 'A+' && g !== 'F').reverse();

/**
 * Finds what the current semester needs for CGPA to reach `rules.minCgpa`.
 * Grades go through the real engine, so repeats replacing old grades are
 * accounted for automatically.
 */
export function planWarningRemoval(
  semesters: TranscriptSemester[],
  term: Term,
  courses: PlannerCourse[],
  rules: WarningRules = DEFAULT_WARNING_RULES,
  gpaRules: GpaRules = DEFAULT_RULES,
  maxPlans = 8,
): WarningPlan {
  const target = rules.minCgpa;
  const free = courses.filter((c) => !c.locked);
  const evaluate = makeEvaluator(semesters, term, courses, gpaRules);

  const allOf = (g: LetterGrade) => Object.fromEntries(free.map((c) => [c.code, g]));
  const best = evaluate(allOf('A'));
  const worst = evaluate(allOf('F')); // the true floor, even though F is never suggested
  const reaches = (cgpa: number) => cgpa >= target - 1e-9;

  const uniformGrade = LEVELS.find((g) => reaches(evaluate(allOf(g)).cgpa)) ?? null;

  // Search grade levels for minimal plans: lowering any single grade one level
  // misses the target. CGPA rises with every grade, so for each choice of the
  // other courses the last course simply takes the lowest level that reaches.
  const plans: GradePlan[] = [];
  if (reaches(best.cgpa) && free.length > 0 && free.length <= MAX_EXHAUSTIVE) {
    const grades: Record<string, LetterGrade> = {};
    const last = free[free.length - 1]!;
    const visit = (i: number) => {
      if (i === free.length - 1) {
        const g = LEVELS.find((level) => reaches(evaluate({ ...grades, [last.code]: level }).cgpa));
        if (!g) return;
        grades[last.code] = g;
        const minimal = free.every((c) => {
          const level = LEVELS.indexOf(grades[c.code]!);
          return level === 0 || !reaches(evaluate({ ...grades, [c.code]: LEVELS[level - 1]! }).cgpa);
        });
        if (minimal) plans.push({ grades: { ...grades }, ...evaluate(grades) });
        return;
      }
      for (const g of LEVELS) {
        grades[free[i]!.code] = g;
        visit(i + 1);
      }
    };
    visit(0);
  } else if (uniformGrade) {
    plans.push({ grades: allOf(uniformGrade), ...evaluate(allOf(uniformGrade)) });
  }

  // Easiest first: least total grade effort, then the lowest top grade needed.
  const effort = (p: GradePlan) =>
    free.reduce((s, c) => s + c.credits * GRADE_POINTS[p.grades[c.code] as LetterGrade], 0);
  const peak = (p: GradePlan) => Math.max(...free.map((c) => GRADE_POINTS[p.grades[c.code] as LetterGrade]));
  plans.sort((a, b) => effort(a) - effort(b) || peak(a) - peak(b));

  return {
    bestCaseCgpa: best.cgpa,
    worstCaseCgpa: worst.cgpa,
    reachable: reaches(best.cgpa),
    requiredSgpa: plans[0]?.sgpa ?? null,
    uniformGrade,
    plans: plans.slice(0, maxPlans),
  };
}

const MAX_EXHAUSTIVE = 6;

/**
 * Returns a fast (sgpa, cgpa) function for grade choices in `term`. It replays
 * the transcript once up to the semester before `term`, then applies each
 * course's grade as a delta: add its points, and remove the earlier attempt it
 * replaces. Equivalent to computeStandings for that semester (see tests).
 */
export function makeEvaluator(
  semesters: TranscriptSemester[],
  term: Term,
  courses: PlannerCourse[],
  gpaRules: GpaRules = DEFAULT_RULES,
) {
  const idx = semesters.findIndex((s) => s.term.label === term.label);
  const before = idx < 0 ? semesters : semesters.slice(0, idx);
  const thisSem = idx < 0 ? null : semesters[idx]!;
  const plannedCodes = new Set(courses.map((c) => c.code));

  // Counted attempt per course code before this semester.
  const counted = new Map<string, { credits: number; points: number }>();
  for (const sem of before) {
    for (const a of sem.courses) {
      if (!countsTowardGpa(a)) continue;
      const pts = GRADE_POINTS[a.grade as LetterGrade];
      const prior = counted.get(a.code);
      if (prior && gpaRules.repeatPolicy === 'best' && prior.points >= pts) continue;
      counted.set(a.code, { credits: a.credits, points: pts });
    }
  }
  // Already-graded courses of this semester that the planner does not control.
  const fixed = (thisSem?.courses ?? []).filter((a) => !plannedCodes.has(a.code) && countsTowardGpa(a));
  const entries = [
    ...fixed.map((a) => ({ code: a.code, credits: a.credits, grade: a.grade as LetterGrade | 'W' })),
  ];

  return (grades: Record<string, LetterGrade | 'W'>) => {
    const final = new Map(counted);
    let semCredits = 0;
    let semPoints = 0;
    const apply = (code: string, credits: number, grade: LetterGrade | 'W') => {
      if (grade === 'W') return;
      const pts = GRADE_POINTS[grade];
      semCredits += credits;
      semPoints += credits * pts;
      const prior = final.get(code);
      if (prior && gpaRules.repeatPolicy === 'best' && prior.points >= pts) return;
      final.set(code, { credits, points: pts });
    };
    for (const e of entries) apply(e.code, e.credits, e.grade);
    for (const c of courses) apply(c.code, c.credits, c.locked ?? grades[c.code] ?? 'F');

    let credits = 0;
    let points = 0;
    for (const v of final.values()) {
      credits += v.credits;
      points += v.credits * v.points;
    }
    return { sgpa: semCredits ? semPoints / semCredits : 0, cgpa: credits ? points / credits : 0 };
  };
}

/** Current-semester courses (graded 'I' / '-') from the transcript, ready for the planner. */
export function inProgressCourses(semester: TranscriptSemester): PlannerCourse[] {
  return semester.courses
    .filter((c) => !c.nonCredit && (c.grade === 'I' || c.grade === '-'))
    .map((c) => ({ code: c.code, name: c.name, credits: c.credits }));
}
