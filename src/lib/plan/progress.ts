import { isPassing, type LetterGrade } from '../flex/grades';
import type { PlannedSemester } from '../flex/studyplan';
import type { Term, TranscriptSemester } from '../flex/transcript';
import { countsTowardGpa } from '../gpa/engine';

export type CourseStatus = 'passed' | 'failed' | 'in-progress' | 'withdrawn' | 'not-taken';

export interface PlanCourseStatus {
  code: string;
  name: string;
  credits: number;
  type: string;
  plannedSemester: number;
  plannedTerm: Term | null;
  status: CourseStatus;
  grade: LetterGrade | null;
  isLab: boolean;
}

export interface DegreeProgress {
  courses: PlanCourseStatus[];
  creditsRequired: number;
  creditsPassed: number;
  electiveSlots: { total: number; filled: number; credits: number };
  /** Courses still to pass (excluding labs, which go with their course), counting open elective slots. */
  coursesRemaining: number;
  /** Regular semesters at the course limit needed for what remains (labs ride along with their course). */
  semestersRemaining: number;
}

export function isLab(name: string, code: string): boolean {
  return /-\s*lab\b/i.test(name) || /^[A-Z]L\d/i.test(code);
}

/**
 * Compares the tentative study plan with the transcript. A course counts as
 * passed by its latest graded attempt, the same rule CGPA uses.
 */
export function degreeProgress(plan: PlannedSemester[], transcript: TranscriptSemester[], maxCoursesPerSemester: number): DegreeProgress {
  const latest = new Map<string, LetterGrade>();
  const attempted = new Map<string, string>();
  for (const sem of transcript) {
    for (const c of sem.courses) {
      attempted.set(c.code, c.grade);
      if (countsTowardGpa(c)) latest.set(c.code, c.grade as LetterGrade);
    }
  }
  const last = transcript.at(-1);
  const inProgress = new Set(
    (last?.courses ?? []).filter((c) => c.grade === 'I' || c.grade === '-').map((c) => c.code),
  );

  const planned = new Set(plan.flatMap((s) => s.courses.map((c) => c.code)));
  const courses: PlanCourseStatus[] = [];
  let slotsTotal = 0;
  let slotCredits = 0;

  for (const sem of plan) {
    for (const c of sem.courses) {
      if (c.isElectiveSlot) {
        slotsTotal += 1;
        slotCredits += c.credits;
        continue;
      }
      const grade = latest.get(c.code) ?? null;
      let status: CourseStatus = 'not-taken';
      if (inProgress.has(c.code)) status = 'in-progress';
      else if (grade) status = isPassing(grade) ? 'passed' : 'failed';
      else if (attempted.get(c.code) === 'W') status = 'withdrawn';
      else if (c.type.match(/non\s*credit/i) && attempted.has(c.code)) status = attempted.get(c.code) === 'S' ? 'passed' : 'failed';
      courses.push({
        code: c.code,
        name: c.name,
        credits: c.credits,
        type: c.type,
        plannedSemester: sem.number,
        plannedTerm: sem.term,
        status,
        grade,
        isLab: isLab(c.name, c.code),
      });
    }
  }

  // Passed electives are courses outside the plan with a passing grade (labs excluded).
  const electivesPassed = [...latest.entries()].filter(
    ([code, g]) => !planned.has(code) && isPassing(g) && !isLab('', code),
  ).length;
  const filled = Math.min(slotsTotal, electivesPassed);

  const counted = courses.filter((c) => !/non\s*credit/i.test(c.type));
  const creditsRequired = counted.reduce((s, c) => s + c.credits, 0) + slotCredits;
  const avgSlot = slotsTotal ? slotCredits / slotsTotal : 0;
  const creditsPassed =
    counted.filter((c) => c.status === 'passed').reduce((s, c) => s + c.credits, 0) + filled * avgSlot;

  const coursesRemaining =
    courses.filter((c) => c.status !== 'passed' && !c.isLab && !/non\s*credit/i.test(c.type)).length + (slotsTotal - filled);

  return {
    courses,
    creditsRequired,
    creditsPassed,
    electiveSlots: { total: slotsTotal, filled, credits: slotCredits },
    coursesRemaining,
    semestersRemaining: Math.ceil(coursesRemaining / Math.max(1, maxCoursesPerSemester)),
  };
}
