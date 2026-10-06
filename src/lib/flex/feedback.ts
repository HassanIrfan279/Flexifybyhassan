import { pick, readTable, toNumber } from './table';

export interface FeedbackCourse {
  code: string;
  name: string;
  credits: number;
  submitted: boolean;
  /** Path of the course's feedback form on Flex (only while pending). */
  formPath: string | null;
}

/** Parses /Student/CourseFeedback: one row per registered course, with a link to the form while feedback is pending. */
export function parseFeedbackList(doc: Document): { active: boolean; courses: FeedbackCourse[] } {
  const inactive = /not active yet/i.test(doc.body?.textContent ?? '');
  for (const table of Array.from(doc.querySelectorAll('table'))) {
    const rows = readTable(table);
    if (!rows[0] || !('code' in rows[0]) || !('status' in rows[0] || 'feedback' in rows[0])) continue;

    const trs = Array.from(table.querySelectorAll('tbody tr'));
    const courses = rows
      .map((row, i): FeedbackCourse | null => {
        const code = pick(row, 'Code').toUpperCase();
        if (!code) return null;
        const link = trs[i]?.querySelector<HTMLAnchorElement>('a[href]');
        const href = link?.getAttribute('href') ?? '';
        const status = pick(row, 'Status', 'Feedback');
        return {
          code,
          name: pick(row, 'Course Name'),
          credits: toNumber(pick(row, 'Credits')),
          submitted: /submitted/i.test(status),
          formPath: href && !href.startsWith('#') && !href.startsWith('javascript') ? safePath(href) : null,
        };
      })
      .filter((c): c is FeedbackCourse => c !== null);
    return { active: !inactive, courses };
  }
  return { active: !inactive, courses: [] };
}

/** Only same-site Flex paths are followed; anything else is ignored. */
export function safePath(href: string): string | null {
  try {
    const url = new URL(href, 'https://flexstudent.nu.edu.pk/Student/');
    return url.hostname === 'flexstudent.nu.edu.pk' ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}

