import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { summarizeCourse, type CourseMarks, type CourseMarksSummary } from '@/lib/flex/marks';
import { cleanText, headerKey, parseCourseHeading } from '@/lib/flex/table';
import type { QueryContext } from '@/lib/query';
import { stores } from '@/lib/storage';
import { injectStyles } from './dom';
import { openQuery } from './query-ui';

const fmt = (n: number | null) => (n === null ? '—' : n.toFixed(2));

/**
 * Adds to the Flex marks page: a summary strip per course, the Grand Total
 * row Flex leaves empty, and a query button on every assessment.
 */
export async function enhanceMarksPage(ctx: ContentScriptContext, courses: CourseMarks[]) {
  injectStyles();
  const identity = (await stores.identity.getValue())?.data ?? null;

  for (const pane of Array.from(document.querySelectorAll<HTMLElement>('.tab-pane'))) {
    const heading = parseCourseHeading(pane.querySelector('h5')?.textContent ?? '');
    const course = heading && courses.find((c) => c.code === heading.code);
    if (!course || !course.categories.length) continue;

    const summary = summarizeCourse(course);
    insertSummary(pane, summary);
    fillGrandTotal(pane, summary);
    addQueryButtons(pane, course, (context) => openQuery(ctx, { ...context, identity }));
  }
}

function insertSummary(pane: HTMLElement, s: CourseMarksSummary) {
  pane.querySelector('.df-summary')?.remove();
  const strip = document.createElement('div');
  strip.className = 'df-summary';
  const part = (...children: (string | Node)[]) => {
    const span = document.createElement('span');
    span.append(...children);
    return span;
  };
  const bold = (text: string, cls = '') => Object.assign(document.createElement('b'), { textContent: text, className: cls });

  strip.append(
    Object.assign(document.createElement('span'), { className: 'df-brand', textContent: 'Flexify' }),
    s.gradedWeight
      ? part(bold(fmt(s.obtained)), ` / ${fmt(s.weightSoFar)} so far (${s.percentage.toFixed(1)}% of uploaded)`)
      : part('No marks uploaded yet'),
  );
  if (s.classAverage !== null) {
    const above = s.obtained >= s.classAverage;
    strip.append(part('Class avg ≈ ', bold(fmt(s.classAverage)), ' · you are ', bold(above ? 'above' : 'below', above ? 'df-above' : 'df-below')));
  }
  if (s.pending.length) {
    strip.append(Object.assign(document.createElement('span'), { className: 'df-pending', textContent: `${s.pending.length} not uploaded` }));
  }
  pane.querySelector('h5')?.after(strip);
}

/** Fills Flex's empty Grand Total table, and re-fills it if Flex's own script clears it. */
function fillGrandTotal(pane: HTMLElement, s: CourseMarksSummary) {
  const table = pane.querySelector<HTMLTableElement>('[id$="Grand_Total_Marks"] table');
  const tbody = table?.tBodies[0];
  if (!table || !tbody) return;

  const values: Record<string, string> = {
    totalmarks: fmt(s.weightSoFar),
    obtainedmarks: fmt(s.obtained),
    classaverage: fmt(s.classAverage),
    min: fmt(s.classMin),
    max: fmt(s.classMax),
    stddev: '—',
  };
  const headers = Array.from(table.querySelectorAll('thead th')).map((th) => headerKey(th.textContent ?? ''));
  const render = () => {
    if (tbody.querySelector('.df-total')) return;
    const tr = document.createElement('tr');
    tr.className = 'df-total';
    tr.title = 'Calculated by Flexify. Class average, min and max are estimates from per-assessment statistics.';
    for (const h of headers) {
      const td = document.createElement('td');
      td.className = 'text-center';
      td.textContent = values[h] ?? '';
      tr.appendChild(td);
    }
    tbody.replaceChildren(tr);
  };
  render();
  new MutationObserver(render).observe(tbody, { childList: true });
}

function addQueryButtons(pane: HTMLElement, course: CourseMarks, open: (c: Omit<QueryContext, 'identity'>) => void) {
  const tables = Array.from(pane.querySelectorAll('table')).filter((t) => t.querySelector('tr.calculationrow'));
  tables.forEach((table) => {
    const categoryName = cleanText(table.closest('.card')?.querySelector('.card-header')?.textContent);
    const category = course.categories.find((c) => c.name === categoryName);
    if (!category) return;

    table.querySelectorAll('tr.calculationrow').forEach((row, i) => {
      const item = category.items[i];
      const cell = row.querySelector('.ObtMarks');
      if (!item || !cell || cell.querySelector('.df-q')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'df-q';
      btn.title = 'Ask your teacher about this mark';
      btn.setAttribute('aria-label', `Query ${category.name} ${item.number}`);
      btn.textContent = '✉';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        open({
          kind: item.obtained === null ? 'marks-missing' : 'marks-discrepancy',
          course,
          item: `${category.name} ${item.number}`,
          details:
            item.obtained === null
              ? `Flex shows: not uploaded (out of ${item.total}).`
              : `Flex shows: ${item.obtained} / ${item.total}.`,
        });
      });
      cell.appendChild(btn);
    });
  });
}
