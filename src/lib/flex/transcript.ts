import { normalizeGrade, type Grade } from './grades';
import { cleanText, pick, readTable, toNumber } from './table';

export type Season = 'Spring' | 'Summer' | 'Fall';

export interface Term {
  season: Season;
  year: number;
  label: string;
}

export interface CourseAttempt {
  code: string;
  name: string;
  section: string;
  credits: number;
  grade: Grade;
  /** Grade points as printed by Flex (per credit hour). */
  points: number;
  /** e.g. "Core", "Elective", "Non Credit". */
  type: string;
  /** e.g. "R-1" for a first repeat, "NC" for non-credit. */
  remarks: string;
  nonCredit: boolean;
}

/** Totals Flex prints above each semester; used to self-check our engine. */
export interface FlexSemesterStats {
  creditsAttempted: number;
  creditsEarned: number;
  cgpa: number;
  sgpa: number;
}

export interface TranscriptSemester {
  term: Term;
  courses: CourseAttempt[];
  flexStats: FlexSemesterStats | null;
}

export interface Transcript {
  batch: string;
  semesters: TranscriptSemester[];
}

const SEASON_ORDER: Record<Season, number> = { Spring: 0, Summer: 1, Fall: 2 };

export function parseTerm(text: string): Term | null {
  const m = /(Spring|Summer|Fall)\s+(\d{4})/i.exec(text);
  if (!m?.[1] || !m[2]) return null;
  const season = (m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()) as Season;
  const year = Number(m[2]);
  return { season, year, label: `${season} ${year}` };
}

export function compareTerms(a: Term, b: Term): number {
  return a.year - b.year || SEASON_ORDER[a.season] - SEASON_ORDER[b.season];
}

/**
 * Parses /Student/Transcript. Each semester is a block holding an <h5> term
 * label, a stats line ("Cr. Att:16  Cr. Ernd:12  CGPA:1.15  SGPA:1.15") and a
 * course table.
 */
export function parseTranscript(doc: Document): Transcript {
  const semesters: TranscriptSemester[] = [];

  for (const table of Array.from(doc.querySelectorAll('table'))) {
    const rows = readTable(table);
    const first = rows[0];
    if (!first || !('crdhrs' in first || 'credits' in first) || !('grade' in first)) continue;

    const block = findSemesterBlock(table);
    const term = block && parseTerm(cleanText(block.querySelector('h5, h4, h3')?.textContent));
    if (!term) continue;

    const courses = rows
      .filter((row) => pick(row, 'Code'))
      .map((row): CourseAttempt => {
        const type = pick(row, 'Type');
        const remarks = pick(row, 'Remarks');
        return {
          code: pick(row, 'Code').toUpperCase(),
          name: pick(row, 'Course Name'),
          section: pick(row, 'Section'),
          credits: toNumber(pick(row, 'CrdHrs', 'Credits', 'Cr Hrs')),
          grade: normalizeGrade(pick(row, 'Grade')),
          points: toNumber(pick(row, 'Points')),
          type,
          remarks,
          nonCredit: /non\s*credit/i.test(type) || /^NC$/i.test(remarks),
        };
      });

    semesters.push({ term, courses, flexStats: parseStats(cleanText(block!.textContent)) });
  }

  semesters.sort((a, b) => compareTerms(a.term, b.term));

  const batchLabel = Array.from(doc.querySelectorAll('span'))
    .find((s) => /^Batch:?$/i.test(cleanText(s.textContent)))
    ?.nextElementSibling?.textContent;

  return { batch: cleanText(batchLabel), semesters };
}

/** Walks up from a course table to the smallest ancestor that also holds the term heading. */
function findSemesterBlock(table: Element): Element | null {
  let el = table.parentElement;
  while (el) {
    const heading = el.querySelector('h5, h4, h3');
    if (heading && parseTerm(heading.textContent ?? '')) return el;
    el = el.parentElement;
  }
  return null;
}

function parseStats(text: string): FlexSemesterStats | null {
  const num = (label: string) => {
    const m = new RegExp(`${label}\\s*:\\s*([\\d.]+)`, 'i').exec(text);
    return m ? Number(m[1]) : NaN;
  };
  const stats = {
    creditsAttempted: num('Cr\\.?\\s*Att'),
    creditsEarned: num('Cr\\.?\\s*Ernd'),
    cgpa: num('CGPA'),
    sgpa: num('SGPA'),
  };
  return Object.values(stats).some(Number.isNaN) ? null : stats;
}
