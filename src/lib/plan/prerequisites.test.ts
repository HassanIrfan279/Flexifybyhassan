import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../../test/fixtures';
import { parseStudyPlan } from '../flex/studyplan';
import { parseTranscript } from '../flex/transcript';
import { analyzePrerequisites, prerequisitesFor } from './prerequisites';

const plan = parseStudyPlan(loadFixture('studyplan.html'));
const { semesters } = parseTranscript(loadFixture('transcript.html'));

describe('prerequisitesFor', () => {
  it('matches the Flex degree label', () => {
    const cs = prerequisitesFor('BS(CS)');
    expect(cs.program).toBe('BS(CS)');
    expect(cs.map['CS2001']).toEqual(['CS1004']);
  });

  it('falls back to shared core rules for programs without data', () => {
    const bba = prerequisitesFor('BBA');
    expect(bba.program).toBeNull();
    expect(bba.map['CS1004']).toEqual(['CS1002']);
  });
});

describe('analyzePrerequisites', () => {
  const result = analyzePrerequisites(plan, semesters, prerequisitesFor('BS(CS)').map);
  const find = (code: string) => result.find((c) => c.code === code)!;

  it('marks courses by whether their prerequisites are passed', () => {
    expect(find('CS1004').status).toBe('passed'); // D on record
    expect(find('CS2001').status).toBe('in-progress'); // being repeated now
    expect(find('CS2005').status).toBe('next-term'); // needs CS2001, in progress
    expect(find('CS3006').status).toBe('blocked'); // needs Operating Systems, not taken
    expect(find('CS3006').prerequisites).toEqual([{ code: 'CS2006', name: 'Operating Systems', met: 'missing' }]);
  });

  it('lists what each course unlocks', () => {
    expect(find('CS2001').unlocks).toEqual(expect.arrayContaining(['CS2005', 'CS2006', 'CS2009', 'CS3001']));
  });

  it('ignores prerequisites outside the student’s roadmap', () => {
    // CS3009 lists CS3004, which this batch's plan doesn't contain.
    expect(find('CS3009').prerequisites).toEqual([]);
    expect(find('CS3009').status).toBe('ready');
  });
});
