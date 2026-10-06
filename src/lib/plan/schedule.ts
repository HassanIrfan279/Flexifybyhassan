import type { Season, Term } from '../flex/transcript';

export interface ScheduleCourse {
  code: string;
  name: string;
  credits: number;
  /** Planned semester number from the study plan (tie-breaker: earlier first). */
  plannedSemester: number;
  isLab: boolean;
}

export interface ScheduleInput {
  /** Courses still to pass. Elective slots are included as ordinary courses with no prerequisites. */
  remaining: ScheduleCourse[];
  /** Courses already passed (plus in-progress ones assumed passed). */
  completed: Set<string>;
  prerequisites: Record<string, string[]>;
  /** First term to schedule into. */
  start: Term;
  maxRegular: number;
  maxSummer: number;
  useSummers: boolean;
  /** Safety stop. */
  maxTerms?: number;
}

export interface ScheduledTerm {
  term: Term;
  courses: ScheduleCourse[];
}

export interface ScheduleResult {
  terms: ScheduledTerm[];
  /** Courses that could never be scheduled (prerequisite missing from the plan). */
  blocked: { course: ScheduleCourse; missing: string[] }[];
  finalTerm: Term | null;
}

export function nextTerm(t: Term): Term {
  const make = (season: Season, year: number): Term => ({ season, year, label: `${season} ${year}` });
  if (t.season === 'Spring') return make('Summer', t.year);
  if (t.season === 'Summer') return make('Fall', t.year);
  return make('Spring', t.year + 1);
}

/** The term a batch normally graduates in: its 8th regular semester (e.g. Fall 2024 → Spring 2028). */
export function onTimeGraduation(batch: Term, regularSemesters = 8): Term {
  let t = batch;
  for (let n = 1; n < regularSemesters; ) {
    t = nextTerm(t);
    if (t.season !== 'Summer') n++;
  }
  return t;
}

/** Regular (non-summer) semesters from `a` to `b`, counting both ends; negative if b is before a. */
export function regularSemestersBetween(a: Term, b: Term): number {
  const index = (t: Term) => t.year * 2 + (t.season === 'Fall' ? 1 : 0);
  return index(b) - index(a);
}

/**
 * Greedy list scheduling. Each term takes the eligible courses (all
 * prerequisites passed in an earlier term) with the longest chain of
 * dependants first, so bottleneck chains start as early as possible. Labs
 * ride along with their theory course and don't count toward the limit.
 */
export function scheduleDegree(input: ScheduleInput): ScheduleResult {
  const { prerequisites: pre, maxRegular, maxSummer, useSummers } = input;
  const remaining = new Map(input.remaining.map((c) => [c.code, c]));
  const completed = new Set(input.completed);
  const known = new Set([...completed, ...remaining.keys()]);

  // A prerequisite that is neither passed nor in the remaining plan can never be met.
  const blocked: ScheduleResult['blocked'] = [];
  for (const c of [...remaining.values()]) {
    const missing = (pre[c.code] ?? []).filter((p) => !known.has(p));
    if (missing.length) {
      blocked.push({ course: c, missing });
      remaining.delete(c.code);
    }
  }

  // Depth of dependants: how many terms must follow this course at minimum.
  const dependants = new Map<string, string[]>();
  for (const code of remaining.keys()) {
    for (const p of pre[code] ?? []) dependants.set(p, [...(dependants.get(p) ?? []), code]);
  }
  const depthMemo = new Map<string, number>();
  const depth = (code: string, seen = new Set<string>()): number => {
    if (depthMemo.has(code)) return depthMemo.get(code)!;
    if (seen.has(code)) return 0; // cycle guard
    seen.add(code);
    const d = 1 + Math.max(0, ...(dependants.get(code) ?? []).filter((x) => remaining.has(x)).map((x) => depth(x, seen)));
    depthMemo.set(code, d);
    return d;
  };

  const terms: ScheduledTerm[] = [];
  let term = input.start;
  const maxTerms = input.maxTerms ?? 30;

  while (remaining.size && terms.length < maxTerms) {
    const isSummer = term.season === 'Summer';
    const limit = isSummer ? (useSummers ? maxSummer : 0) : maxRegular;
    if (limit > 0) {
      const eligible = [...remaining.values()].filter((c) => (pre[c.code] ?? []).every((p) => completed.has(p)));
      const theory = eligible
        .filter((c) => !c.isLab)
        .sort((a, b) => depth(b.code) - depth(a.code) || a.plannedSemester - b.plannedSemester || a.code.localeCompare(b.code))
        .slice(0, limit);
      // Labs go with their theory course; a lab whose theory is already passed fits in any term.
      const labs = eligible.filter(
        (l) => l.isLab && (theory.some((t) => labMatches(l, t)) || ![...remaining.values()].some((t) => !t.isLab && labMatches(l, t))),
      );
      const chosen = [...theory, ...labs];
      if (chosen.length) {
        terms.push({ term, courses: chosen });
        for (const c of chosen) remaining.delete(c.code);
        for (const c of chosen) completed.add(c.code);
      } else if (!isSummer) {
        // Nothing eligible in a regular term means a prerequisite cycle in the data.
        for (const c of remaining.values()) blocked.push({ course: c, missing: (pre[c.code] ?? []).filter((p) => !completed.has(p)) });
        break;
      }
    }
    term = nextTerm(term);
  }

  return { terms, blocked, finalTerm: terms.at(-1)?.term ?? null };
}

function labMatches(lab: ScheduleCourse, theory: ScheduleCourse): boolean {
  const base = lab.name.replace(/\s*-\s*lab\s*$/i, '').trim().toLowerCase();
  return base === theory.name.trim().toLowerCase() || lab.code.slice(2) === theory.code.slice(2);
}
