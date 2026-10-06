import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../../test/fixtures';
import { parseStudyPlan } from '../flex/studyplan';
import { parseTranscript } from '../flex/transcript';
import { degreeProgress, isLab } from './progress';

const plan = parseStudyPlan(loadFixture('studyplan.html'));
const { semesters } = parseTranscript(loadFixture('transcript.html'));
const progress = degreeProgress(plan, semesters, 5);
const status = (code: string) => progress.courses.find((c) => c.code === code)?.status;

describe('degreeProgress', () => {
  it('marks courses by their latest graded attempt', () => {
    expect(status('CS1002')).toBe('passed'); // F, then D on repeat
    expect(status('CS3005')).toBe('failed'); // F, then W on repeat
    expect(status('CS2001')).toBe('in-progress');
    expect(status('EE1005')).toBe('passed'); // W, then C- later
    expect(status('CS4031')).toBe('not-taken');
  });

  it('fills elective slots with passed courses outside the plan', () => {
    expect(progress.electiveSlots.filled).toBe(1); // SS1023 French Language
    expect(progress.electiveSlots.total).toBeGreaterThanOrEqual(8);
  });

  it('counts remaining courses without labs and estimates semesters at the course limit', () => {
    expect(progress.creditsPassed).toBeLessThan(progress.creditsRequired);
    expect(progress.semestersRemaining).toBe(Math.ceil(progress.coursesRemaining / 5));
  });

  it('recognises labs', () => {
    expect(isLab('Data Structures - Lab', 'CL2001')).toBe(true);
    expect(isLab('Data Structures', 'CS2001')).toBe(false);
  });
});
