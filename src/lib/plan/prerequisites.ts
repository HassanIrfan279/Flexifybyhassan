import { isPassing, type LetterGrade } from '../flex/grades';
import type { PlannedSemester } from '../flex/studyplan';
import type { TranscriptSemester } from '../flex/transcript';
import { countsTowardGpa } from '../gpa/engine';
import data from './prerequisites.data.json';

type ProgramData = { sources: string[]; courses: Record<string, { name: string; prerequisites: string[]; corequisites: string[] }> };
const PROGRAMS = (data as { programs: Record<string, ProgramData> }).programs;

/** Rules backed by a single source; the UI asks students to confirm them. */
export const NEEDS_VERIFYING = new Set(['EE1005']);

export interface PrerequisiteMap {
  /** Program key the map came from, or null when falling back to shared core courses. */
  program: string | null;
  map: Record<string, string[]>;
  sources: string[];
}

/** Prerequisites for a Flex degree label such as "BS(CS)". Unknown programs get the shared core rules. */
export function prerequisitesFor(degree: string): PrerequisiteMap {
  const key = Object.keys(PROGRAMS).find((k) => k.replace(/\s/g, '').toUpperCase() === degree.replace(/\s/g, '').toUpperCase());
  if (key) {
    const p = PROGRAMS[key]!;
    return { program: key, map: Object.fromEntries(Object.entries(p.courses).map(([c, v]) => [c, v.prerequisites])), sources: p.sources };
  }
  // Courses shared across programs (CS core, maths, humanities): keep only rules all programs agree on.
  const merged: Record<string, string[]> = {};
  for (const p of Object.values(PROGRAMS)) {
    for (const [code, v] of Object.entries(p.courses)) {
      if (!v.prerequisites.length) continue;
      merged[code] = merged[code] ? merged[code]!.filter((x) => v.prerequisites.includes(x)) : [...v.prerequisites];
    }
  }
  return { program: null, map: merged, sources: [...new Set(Object.values(PROGRAMS).flatMap((p) => p.sources))] };
}

export type PrereqStatus = 'passed' | 'in-progress' | 'ready' | 'next-term' | 'blocked';

export interface PrereqCourse {
  code: string;
  name: string;
  plannedSemester: number;
  status: PrereqStatus;
  /** Prerequisites that apply to this student's roadmap. */
  prerequisites: { code: string; name: string; met: 'passed' | 'in-progress' | 'missing' }[];
  /** Courses in the roadmap that need this one. */
  unlocks: string[];
  verify: boolean;
}

/**
 * For every course in the study plan: can it be taken now? A prerequisite
 * counts as met when its latest graded attempt is a pass. Prerequisites that
 * aren't in the student's own roadmap or transcript are ignored (curricula
 * differ by batch).
 */
export function analyzePrerequisites(
  plan: PlannedSemester[],
  transcript: TranscriptSemester[],
  prereqs: Record<string, string[]>,
): PrereqCourse[] {
  const latest = new Map<string, LetterGrade>();
  for (const sem of transcript) for (const c of sem.courses) if (countsTowardGpa(c)) latest.set(c.code, c.grade as LetterGrade);
  const last = transcript.at(-1);
  const inProgress = new Set((last?.courses ?? []).filter((c) => c.grade === 'I' || c.grade === '-').map((c) => c.code));

  const names = new Map<string, string>();
  for (const s of plan) for (const c of s.courses) names.set(c.code, c.name);
  for (const s of transcript) for (const c of s.courses) if (!names.has(c.code)) names.set(c.code, c.name);
  const relevant = (code: string) => names.has(code);

  const passed = (code: string) => {
    const g = latest.get(code);
    return !!g && isPassing(g) && !inProgress.has(code);
  };

  const courses = plan.flatMap((s) => s.courses.filter((c) => !c.isElectiveSlot).map((c) => ({ ...c, semester: s.number })));
  const unlocks = new Map<string, string[]>();
  for (const c of courses) for (const p of (prereqs[c.code] ?? []).filter(relevant)) unlocks.set(p, [...(unlocks.get(p) ?? []), c.code]);

  return courses
    .filter((c) => !/non\s*credit/i.test(c.type) || prereqs[c.code]?.length)
    .map((c): PrereqCourse => {
      const list = (prereqs[c.code] ?? []).filter(relevant).map((p) => ({
        code: p,
        name: names.get(p) ?? p,
        met: passed(p) ? ('passed' as const) : inProgress.has(p) ? ('in-progress' as const) : ('missing' as const),
      }));
      let status: PrereqStatus;
      if (passed(c.code)) status = 'passed';
      else if (inProgress.has(c.code)) status = 'in-progress';
      else if (list.every((p) => p.met === 'passed')) status = 'ready';
      else if (list.every((p) => p.met !== 'missing')) status = 'next-term';
      else status = 'blocked';
      return {
        code: c.code,
        name: c.name,
        plannedSemester: c.semester,
        status,
        prerequisites: list,
        unlocks: unlocks.get(c.code) ?? [],
        verify: NEEDS_VERIFYING.has(c.code),
      };
    });
}
