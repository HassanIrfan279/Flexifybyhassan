import { cleanText, pick, readTable, toNumber } from './table';
import { parseTerm, type Term } from './transcript';

export interface PlannedCourse {
  code: string;
  name: string;
  credits: number;
  /** "Core", "Elective", "Non Credit", ... */
  type: string;
  /** Elective slots use placeholder codes such as "CSX01". */
  isElectiveSlot: boolean;
}

export interface PlannedSemester {
  number: number;
  term: Term | null;
  courses: PlannedCourse[];
}

/** Parses /Student/TentativeStudyPlan: "Semester No. N (Fall 2024)" headings, each followed by a course table. */
export function parseStudyPlan(doc: Document): PlannedSemester[] {
  const semesters: PlannedSemester[] = [];

  for (const table of Array.from(doc.querySelectorAll('table'))) {
    const rows = readTable(table);
    const first = rows[0];
    if (!first || !('crdhrs' in first) || 'grade' in first) continue;

    const heading = cleanText(table.parentElement?.querySelector('h4, h5')?.textContent);
    const num = /Semester\s*No\.?\s*(\d+)/i.exec(heading);
    if (!num?.[1]) continue;

    semesters.push({
      number: Number(num[1]),
      term: parseTerm(heading),
      courses: rows
        .filter((row) => pick(row, 'Code'))
        .map((row) => {
          const code = pick(row, 'Code').toUpperCase();
          const type = pick(row, 'Type');
          return {
            code,
            name: pick(row, 'Course Name'),
            credits: toNumber(pick(row, 'CrdHrs')),
            type,
            isElectiveSlot: /elective/i.test(type) && /X\d/i.test(code),
          };
        }),
    });
  }

  return semesters.sort((a, b) => a.number - b.number);
}
