import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../../test/fixtures';
import { LETTER_GRADES, type LetterGrade } from '../flex/grades';
import { parseTranscript } from '../flex/transcript';
import { applyOverrides, attemptKey, computeStandings } from './engine';
import { inProgressCourses, makeEvaluator, planWarningRemoval, warningHistory } from './warnings';

const { semesters } = parseTranscript(loadFixture('transcript.html'));
const current = semesters.at(-1)!;
const courses = inProgressCourses(current);

describe('warningHistory', () => {
  it('counts warnings, resets on recovery and skips semesters with nothing graded', () => {
    const history = warningHistory(semesters, computeStandings(semesters));
    expect(history.map((h) => `${h.term.label}:${h.change}:${h.count}`)).toEqual([
      'Fall 2024:warning:1',
      'Spring 2025:warning:2',
      'Summer 2025:reset:0', // summer counts: CGPA 2.03 cleared the warnings
      'Fall 2025:warning:1',
      'Spring 2026:warning:2',
      'Summer 2026:skipped:2', // every course withdrawn
      'Fall 2026:skipped:2', // in progress
    ]);
  });
});

describe('makeEvaluator', () => {
  it('agrees with the full engine for arbitrary grade choices', () => {
    const evaluate = makeEvaluator(semesters, current.term, courses);
    const picks: (LetterGrade | 'W')[][] = [
      ['A', 'F', 'C', 'W', 'B+'],
      ['D', 'D', 'D', 'D', 'D'],
      ['W', 'W', 'W', 'W', 'W'],
      ['A-', 'C+', 'F', 'B', 'C-'],
    ];
    for (const pick of picks) {
      const grades = Object.fromEntries(courses.map((c, i) => [c.code, pick[i]!]));
      const overrides = Object.fromEntries(courses.map((c) => [attemptKey(current.term, c.code), grades[c.code]!]));
      const full = computeStandings(applyOverrides(semesters, overrides)).at(-1)!;
      const fast = evaluate(grades);
      expect(fast.cgpa).toBeCloseTo(full.cgpa, 10);
      expect(fast.sgpa).toBeCloseTo(full.sgpa, 10);
    }
  });
});

describe('planWarningRemoval', () => {
  const plan = planWarningRemoval(semesters, current.term, courses);

  it('finds the semester reachable and the lowest uniform grade', () => {
    expect(plan.reachable).toBe(true);
    expect(plan.worstCaseCgpa).toBeLessThan(2);
    expect(plan.bestCaseCgpa).toBeGreaterThan(2);
    expect(LETTER_GRADES).toContain(plan.uniformGrade);
  });

  it('returns only plans that reach 2.00 and cannot be lowered', () => {
    const evaluate = makeEvaluator(semesters, current.term, courses);
    expect(plan.plans.length).toBeGreaterThan(0);
    for (const p of plan.plans) expect(p.cgpa).toBeGreaterThanOrEqual(2);
    for (const p of plan.plans) expect(Object.values(p.grades)).not.toContain('F');
    expect(plan.requiredSgpa).not.toBeNull();
    expect(evaluate(plan.plans[0]!.grades).cgpa).toBeGreaterThanOrEqual(2);
  });

  it('respects a locked grade', () => {
    const locked = courses.map((c) => (c.code === 'NS1001' ? { ...c, locked: 'F' as const } : c));
    const withF = planWarningRemoval(semesters, current.term, locked);
    for (const p of withF.plans) expect(p.grades['NS1001']).toBeUndefined();
    expect(withF.bestCaseCgpa).toBeLessThan(plan.bestCaseCgpa);
  });
});
