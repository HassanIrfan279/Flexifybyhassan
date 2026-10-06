import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../../test/fixtures';
import { estimateTotalLectures, parseAttendance, summarizeAttendance } from './attendance';
import { neededForTarget, parseMarks, summarizeCourse } from './marks';
import { parseProfile } from './profile';
import { parseStudyPlan } from './studyplan';
import { parseCourseHeading, parseFlexDate } from './table';

describe('helpers', () => {
  it('parses Flex dates and course headings', () => {
    expect(parseFlexDate('05-Oct-2026')).toBe('2026-10-05');
    expect(parseCourseHeading('CL2001-Data Structures - Lab (BCS-3E)')).toEqual({
      code: 'CL2001',
      name: 'Data Structures - Lab',
      section: 'BCS-3E',
    });
  });
});

describe('parseProfile', () => {
  const profile = parseProfile(loadFixture('home.html'));

  it('reads university information and the academic calendar', () => {
    expect(profile).toMatchObject({ degree: 'BS(CS)', campus: 'Lahore', section: 'BCS-3C', batch: 'Fall 2024', status: 'Current' });
    expect(profile.calendar.classes).toEqual({ start: '2026-08-17', end: '2026-12-11' });
    expect(profile.calendar.feedback).toEqual([{ start: '2026-09-14', end: '2026-09-23' }]);
  });
});

describe('parseMarks', () => {
  const courses = parseMarks(loadFixture('marks.html'));
  const byCode = (code: string) => courses.find((c) => c.code === code)!;

  it('reads every registered course, including ones without marks yet', () => {
    expect(courses.map((c) => c.code)).toEqual(['CL2001', 'CS1005', 'CS2001', 'NS1001', 'SS1007']);
    expect(byCode('CS1005').categories).toEqual([]);
  });

  it('builds the grand total from Flex category totals', () => {
    const ds = byCode('CS2001');
    expect(ds.categories.map((c) => c.name)).toEqual(['Assignment', 'Quiz', 'Sessional-I']);
    const summary = summarizeCourse(ds);
    expect(summary.weightSoFar).toBe(40);
    expect(summary.obtained).toBeCloseTo(22.201, 2);
    expect(summary.classAverage).toBeCloseTo(29.566, 2);
  });

  it('separates marks not uploaded from zero marks', () => {
    const lab = summarizeCourse(byCode('CL2001'));
    expect(lab.pending).toHaveLength(4);
    expect(lab.classAverage).toBeNull(); // nothing to compare against yet
    const islamiat = summarizeCourse(byCode('SS1007'));
    expect(islamiat.gradedWeight).toBe(25); // the quiz without marks is left out
    expect(islamiat.percentage).toBeCloseTo((15.5 / 25) * 100, 2);
    const assignment = byCode('CS2001').categories[0]!.items[0]!;
    expect(assignment.obtained).toBe(51);
  });

  it('works out marks needed in the remaining weight', () => {
    const need = neededForTarget(summarizeCourse(byCode('CS2001')), 50);
    expect(need.remainingWeight).toBe(60);
    expect(need.marksNeeded).toBeCloseTo(27.8, 2);
    expect(need.reachable).toBe(true);
  });
});

describe('parseAttendance', () => {
  const courses = parseAttendance(loadFixture('attendance.html'));
  const physics = courses.find((c) => c.code === 'NS1001')!;

  it('reads each lecture and the percentage Flex prints', () => {
    expect(courses).toHaveLength(5);
    expect(physics.lectures).toHaveLength(14);
    expect(physics.lectures[0]).toEqual({ number: 1, date: '2026-08-18', hours: 1.5, present: false });
    expect(physics.flexPercentage).toBe(57);
  });

  it('counts classes needed to recover and absences still allowed', () => {
    const s = summarizeAttendance(physics, 0.8, 30);
    expect(s).toMatchObject({ held: 14, attended: 8, absences: 6, toRecover: 16, canStillMiss: 0 });
    const discrete = summarizeAttendance(courses.find((c) => c.code === 'CS1005')!, 0.8, 30);
    expect(discrete).toMatchObject({ absences: 2, toRecover: 2, canStillMiss: 4 });
  });

  it('estimates semester lectures from the pace so far', () => {
    const total = estimateTotalLectures(physics, { start: '2026-08-17', end: '2026-12-11' }, '2026-10-06');
    expect(total).toBeGreaterThanOrEqual(28);
    expect(total).toBeLessThanOrEqual(36);
  });
});

describe('parseStudyPlan', () => {
  const plan = parseStudyPlan(loadFixture('studyplan.html'));

  it('reads numbered semesters with terms and courses', () => {
    expect(plan[0]).toMatchObject({ number: 1, term: { label: 'Fall 2024' } });
    expect(plan[0]!.courses).toHaveLength(9);
    expect(plan[0]!.courses.at(-1)).toMatchObject({ code: 'SS1018', type: 'Non Credit' });
  });

  it('flags elective placeholder slots', () => {
    const slots = plan.flatMap((s) => s.courses).filter((c) => c.isElectiveSlot).map((c) => c.code);
    expect(slots).toContain('CSX01');
    expect(slots).not.toContain('SS1023');
  });
});
