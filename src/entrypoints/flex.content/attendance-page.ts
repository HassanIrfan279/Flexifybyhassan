import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import type { CourseAttendance } from '@/lib/flex/attendance';
import { parseCourseHeading } from '@/lib/flex/table';
import { stores } from '@/lib/storage';
import { injectStyles } from './dom';
import { openQuery } from './query-ui';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Adds a query button to every lecture marked absent on the Flex attendance page. */
export async function enhanceAttendancePage(ctx: ContentScriptContext, courses: CourseAttendance[]) {
  injectStyles();
  const identity = (await stores.identity.getValue())?.data ?? null;

  for (const pane of Array.from(document.querySelectorAll<HTMLElement>('.tab-pane'))) {
    const heading = parseCourseHeading(pane.querySelector('h5')?.textContent ?? '');
    const course = heading && courses.find((c) => c.code === heading.code);
    if (!course) continue;

    pane.querySelectorAll('tbody tr').forEach((row, i) => {
      const lecture = course.lectures[i];
      const cell = row.lastElementChild;
      if (!lecture || lecture.present || !cell || cell.querySelector('.df-q')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'df-q';
      btn.title = 'Ask your teacher to correct this absence';
      btn.setAttribute('aria-label', `Query absence in lecture ${lecture.number}`);
      btn.textContent = '✉';
      btn.addEventListener('click', () =>
        openQuery(ctx, {
          kind: 'attendance',
          course,
          item: `Lecture ${lecture.number} on ${DATE.format(new Date(lecture.date))}`,
          details: `Flex shows: Absent (${lecture.hours} hour${lecture.hours === 1 ? '' : 's'}).`,
          identity,
        }),
      );
      cell.appendChild(btn);
    });
  }
}
