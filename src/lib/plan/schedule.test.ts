import { describe, expect, it } from 'vitest';
import { parseTerm, type Term } from '../flex/transcript';
import { nextTerm, onTimeGraduation, regularSemestersBetween, scheduleDegree, type ScheduleCourse } from './schedule';

const t = (label: string) => parseTerm(label) as Term;
const c = (code: string, plannedSemester = 1, name = code): ScheduleCourse => ({
  code,
  name,
  credits: 3,
  plannedSemester,
  isLab: /^[A-Z]L/.test(code),
});

describe('terms', () => {
  it('steps Spring → Summer → Fall → Spring', () => {
    expect(nextTerm(t('Spring 2026')).label).toBe('Summer 2026');
    expect(nextTerm(t('Summer 2026')).label).toBe('Fall 2026');
    expect(nextTerm(t('Fall 2026')).label).toBe('Spring 2027');
  });

  it('finds the on-time graduation term and counts regular semesters', () => {
    expect(onTimeGraduation(t('Fall 2024')).label).toBe('Spring 2028');
    expect(regularSemestersBetween(t('Spring 2028'), t('Fall 2028'))).toBe(1);
  });
});

describe('scheduleDegree', () => {
  const base = { completed: new Set<string>(), start: t('Spring 2027'), maxRegular: 2, maxSummer: 1, useSummers: false };

  it('respects prerequisite chains and the course limit', () => {
    const result = scheduleDegree({
      ...base,
      remaining: [c('A'), c('B'), c('C'), c('D')],
      prerequisites: { B: ['A'], C: ['B'] },
    });
    const when = (code: string) => result.terms.findIndex((x) => x.courses.some((y) => y.code === code));
    expect(when('A')).toBeLessThan(when('B'));
    expect(when('B')).toBeLessThan(when('C'));
    for (const term of result.terms) expect(term.courses.filter((x) => !x.isLab).length).toBeLessThanOrEqual(2);
    // The A→B→C chain needs three terms; D fits alongside A.
    expect(result.terms.map((x) => x.term.label)).toEqual(['Spring 2027', 'Fall 2027', 'Spring 2028']);
  });

  it('starts the longest chain first', () => {
    const result = scheduleDegree({
      ...base,
      maxRegular: 1,
      remaining: [c('X', 1), c('A', 5), c('B', 6)],
      prerequisites: { B: ['A'] },
    });
    expect(result.terms[0]!.courses[0]!.code).toBe('A');
  });

  it('uses summers when allowed', () => {
    const result = scheduleDegree({ ...base, useSummers: true, maxRegular: 1, remaining: [c('A'), c('B')], prerequisites: {} });
    expect(result.terms.map((x) => x.term.label)).toEqual(['Spring 2027', 'Summer 2027']);
  });

  it('keeps labs with their course without counting them', () => {
    const result = scheduleDegree({
      ...base,
      maxRegular: 1,
      remaining: [c('CS2001', 1, 'Data Structures'), c('CL2001', 1, 'Data Structures - Lab')],
      prerequisites: {},
    });
    expect(result.terms).toHaveLength(1);
    expect(result.terms[0]!.courses.map((x) => x.code).sort()).toEqual(['CL2001', 'CS2001']);
  });

  it('reports prerequisites that are not in the plan', () => {
    const result = scheduleDegree({ ...base, remaining: [c('Z')], prerequisites: { Z: ['MISSING'] } });
    expect(result.blocked[0]?.missing).toEqual(['MISSING']);
  });
});
