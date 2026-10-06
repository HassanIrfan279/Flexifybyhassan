import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../../test/fixtures';
import { parseTranscript } from '../flex/transcript';
import { applyOverrides, attemptKey, computeStandings, round2, verifyAgainstFlex } from './engine';

const transcript = parseTranscript(loadFixture('transcript.html'));

describe('parseTranscript', () => {
  it('reads every semester in chronological order', () => {
    expect(transcript.semesters.map((s) => s.term.label)).toEqual([
      'Fall 2024',
      'Spring 2025',
      'Summer 2025',
      'Fall 2025',
      'Spring 2026',
      'Summer 2026',
      'Fall 2026',
    ]);
    expect(transcript.batch).toBe('Fall 2024');
  });

  it('reads course rows by column meaning', () => {
    const cs1002 = transcript.semesters[1]!.courses.find((c) => c.code === 'CS1002')!;
    expect(cs1002).toMatchObject({ credits: 3, grade: 'D+', points: 1.33, remarks: 'R-1', nonCredit: false });
    const quran = transcript.semesters[0]!.courses.find((c) => c.code === 'SS1018')!;
    expect(quran).toMatchObject({ grade: 'U', nonCredit: true });
  });

  it('reads the totals Flex prints for each semester', () => {
    expect(transcript.semesters[0]!.flexStats).toEqual({ creditsAttempted: 16, creditsEarned: 10, cgpa: 1.29, sgpa: 1.29 });
  });
});

describe('computeStandings', () => {
  const standings = computeStandings(transcript.semesters);

  it('matches every SGPA, CGPA and credit total Flex prints', () => {
    expect(verifyAgainstFlex(transcript.semesters, standings)).toEqual([]);
  });

  it('replaces an F with the latest repeat attempt', () => {
    const spring25 = standings[1]!;
    expect(spring25.creditsAttempted).toBe(24); // 16 + 12, not 28: the repeats replaced the F attempts
    expect(spring25.replacements.map((r) => `${r.code} ${r.previous.grade}->${r.current.grade}`)).toEqual([
      'CS1002 F->D+',
      'MT1003 F->D',
    ]);
  });

  it('does not let a withdrawal replace an earlier grade', () => {
    const summer26 = standings[5]!;
    expect(summer26.replacements).toEqual([]);
    expect(round2(summer26.cgpa)).toBe(1.76);
  });

  it('can use the best attempt instead of the latest', () => {
    const latest = computeStandings(transcript.semesters, { repeatPolicy: 'latest' });
    const best = computeStandings(transcript.semesters, { repeatPolicy: 'best' });
    expect(best.at(-1)!.cgpa).toBeGreaterThanOrEqual(latest.at(-1)!.cgpa);
  });
});

describe('what-if grades', () => {
  const fall26 = transcript.semesters.at(-1)!;

  it('projects CGPA when in-progress repeats get grades', () => {
    const overrides = Object.fromEntries(fall26.courses.map((c) => [attemptKey(fall26.term, c.code), 'B' as const]));
    const projected = computeStandings(applyOverrides(transcript.semesters, overrides)).at(-1)!;
    expect(projected.sgpa).toBe(3);
    expect(projected.cgpa).toBeGreaterThan(2);
    expect(projected.replacements.map((r) => r.code).sort()).toEqual(['CL2001', 'CS1005', 'CS2001', 'NS1001', 'SS1007']);
  });

  it('ignores a course marked as withdrawn', () => {
    const overrides = Object.fromEntries(fall26.courses.map((c) => [attemptKey(fall26.term, c.code), 'W' as const]));
    const projected = computeStandings(applyOverrides(transcript.semesters, overrides)).at(-1)!;
    expect(round2(projected.cgpa)).toBe(1.76);
  });
});
