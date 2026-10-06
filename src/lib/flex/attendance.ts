import { cleanText, parseCourseHeading, parseFlexDate, pick, readTable, toNumber } from './table';

export interface Lecture {
  number: number;
  /** ISO date, e.g. "2026-08-17". */
  date: string;
  hours: number;
  present: boolean;
}

export interface CourseAttendance {
  code: string;
  name: string;
  section: string;
  /** The percentage Flex prints (updated with a ~24 hour lag). */
  flexPercentage: number | null;
  lectures: Lecture[];
}

/** Parses /Student/StudentAttendance: one `.tab-pane` per course with a heading, a progress bar and a lecture table. */
export function parseAttendance(doc: Document): CourseAttendance[] {
  const courses: CourseAttendance[] = [];

  for (const pane of Array.from(doc.querySelectorAll('.tab-pane'))) {
    const heading = parseCourseHeading(pane.querySelector('h5')?.textContent ?? '');
    const table = pane.querySelector('table');
    if (!heading || !table) continue;

    const lectures = readTable(table as HTMLTableElement)
      .map((row, i): Lecture | null => {
        const date = parseFlexDate(pick(row, 'Date'));
        const presence = pick(row, 'Presence').toUpperCase();
        if (!date || !presence) return null;
        return {
          number: toNumber(pick(row, 'Lecture No')) || i + 1,
          date,
          hours: toNumber(pick(row, 'Duration (In Hours)', 'Duration')),
          present: presence.startsWith('P'),
        };
      })
      .filter((l): l is Lecture => l !== null);

    const bar = pane.querySelector('[role="progressbar"]');
    const pctText = bar?.getAttribute('aria-valuenow') ?? cleanText(bar?.textContent);
    const flexPercentage = pctText ? toNumber(pctText) : null;

    courses.push({ ...heading, flexPercentage, lectures });
  }

  return courses;
}

export interface AttendanceSummary {
  held: number;
  attended: number;
  absences: number;
  /** attended / held, from the lecture list. */
  percentage: number;
  /** Expected lectures over the whole semester (estimated or user-set). */
  expectedTotal: number;
  /** Absences still allowed before dropping under the minimum by semester end. */
  canStillMiss: number;
  /** Consecutive classes needed right now to get back to the minimum (0 if already above). */
  toRecover: number;
}

/**
 * @param minimum required attendance, e.g. 0.8 for 80%.
 * @param expectedTotal lectures expected over the semester; estimate with `estimateTotalLectures`.
 */
export function summarizeAttendance(course: CourseAttendance, minimum: number, expectedTotal: number): AttendanceSummary {
  const held = course.lectures.length;
  const attended = course.lectures.filter((l) => l.present).length;
  const absences = held - attended;
  const total = Math.max(expectedTotal, held);
  const maxAbsences = total - Math.ceil(minimum * total - 1e-9);

  // Smallest k with (attended + k) / (held + k) >= minimum.
  const toRecover = attended >= minimum * held ? 0 : Math.ceil((minimum * held - attended) / (1 - minimum) - 1e-9);

  return {
    held,
    attended,
    absences,
    percentage: held ? (attended / held) * 100 : 100,
    expectedTotal: total,
    canStillMiss: maxAbsences - absences,
    toRecover,
  };
}

/**
 * Projects the semester's lecture count from the pace so far: lectures per
 * elapsed week × total weeks of classes.
 */
export function estimateTotalLectures(course: CourseAttendance, classes: { start: string; end: string }, today: string): number {
  const week = 7 * 24 * 3600 * 1000;
  const start = Date.parse(classes.start);
  const totalWeeks = Math.max(1, Math.round((Date.parse(classes.end) - start) / week));
  const elapsedWeeks = Math.min(totalWeeks, Math.max(1, Math.ceil((Date.parse(today) - start) / week)));
  const perWeek = course.lectures.length / elapsedWeeks;
  return Math.max(course.lectures.length, Math.round(perWeek * totalWeeks));
}
