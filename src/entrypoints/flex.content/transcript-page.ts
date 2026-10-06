import { GRADE_POINTS, LETTER_GRADES, type Grade, type LetterGrade } from '@/lib/flex/grades';
import { cleanText, headerKey } from '@/lib/flex/table';
import type { Transcript, TranscriptSemester } from '@/lib/flex/transcript';
import { countedGrades, fmt2, inProgressSemester, priorAttempt } from '@/lib/gpa/academic';
import { applyOverrides, attemptKey, computeStandings, type GpaRules } from '@/lib/gpa/engine';
import { el, injectStyles } from './dom';

const PLANNED_TERM = { season: 'Fall' as const, year: 9999, label: 'Planned repeats' };

/**
 * Turns Flex's Transcript page into a GPA calculator: grade pickers on the
 * in-progress semester, repeat labels showing what each repeat replaces,
 * planned future repeats, and live projected SGPA/CGPA — all computed with
 * FAST's rules (latest attempt replaces; W, I, S/U excluded).
 * Returns a function that restores the page.
 */
export function enhanceTranscriptPage(transcript: Transcript, rules: GpaRules): () => void {
  injectStyles();
  const { semesters } = transcript;
  const current = inProgressSemester(semesters);
  const currentIndex = current ? semesters.indexOf(current) : -1;
  const restore: (() => void)[] = [];

  const whatIf: Record<string, Grade | ''> = {};
  const repeats: Record<string, LetterGrade | ''> = {};
  const before = computeStandings(semesters, rules);

  // --- panel ---------------------------------------------------------------
  const cgpaValue = el('span', { className: 'df-tx-big' });
  const delta = el('span', { className: 'df-tx-delta' });
  const sgpaValue = el('span', { className: 'df-tx-mid' });
  const panel = el('section', { className: 'df-tx-panel' }, [
    el('div', { className: 'df-tx-head' }, [
      el('span', { className: 'df-tx-brand', textContent: 'Flexify' }),
      el('span', { className: 'df-tx-sub', textContent: 'GPA calculator' }),
    ]),
    el('div', { className: 'df-tx-stats' }, [
      el('div', {}, [el('span', { className: 'df-tx-label', textContent: 'Projected CGPA' }), cgpaValue, delta]),
      el('div', {}, [el('span', { className: 'df-tx-label', textContent: current ? `${current.term.label} SGPA` : 'SGPA' }), sgpaValue]),
    ]),
  ]);

  if (current) {
    const presets = el('div', { className: 'df-tx-presets' }, [
      ...(['A', 'B', 'C'] as const).map((g) => button(`All ${g}`, () => setAll(g))),
      button('Reset', () => setAll('')),
    ]);
    panel.append(presets, el('p', { className: 'df-tx-note', textContent: 'Pick grades in the table below. A repeat replaces your earlier grade only with a letter grade; W leaves the old grade in place.' }));
  }

  // Planned future repeats of low grades (D+ or below).
  const candidates = [...countedGrades(semesters).entries()].filter(
    ([code, c]) => GRADE_POINTS[c.grade] < 2 && !current?.courses.some((x) => x.code === code),
  );
  if (candidates.length) {
    const list = el('div', { className: 'df-tx-repeats' });
    for (const [code, c] of candidates) {
      const select = gradeSelect(['', ...LETTER_GRADES.filter((g) => g !== 'A+')], (v) => {
        repeats[code] = v as LetterGrade | '';
        update();
      });
      list.append(el('label', { className: 'df-tx-repeat' }, [el('span', { textContent: `${code} · now ${c.grade}` }), select]));
    }
    panel.append(el('span', { className: 'df-tx-label', textContent: 'Plan a future repeat' }), list);
  }

  const firstBlock = findSemesterBlock(semesters[0]?.term.label ?? '');
  const anchor = firstBlock?.closest('.m-portlet') ?? firstBlock;
  anchor?.parentElement?.insertBefore(panel, anchor);
  restore.push(() => panel.remove());

  // --- grade pickers in the in-progress semester ---------------------------
  const pickers = new Map<string, HTMLSelectElement>();
  if (current) {
    const block = findSemesterBlock(current.term.label);
    const table = block?.querySelector('table');
    if (table) {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => headerKey(th.textContent ?? ''));
      const gradeCol = headers.indexOf('grade');
      const remarksCol = headers.indexOf('remarks');
      for (const row of Array.from(table.querySelectorAll('tbody tr'))) {
        const cells = Array.from(row.querySelectorAll('td'));
        const code = cleanText(cells[0]?.textContent).toUpperCase();
        const course = current.courses.find((c) => c.code === code);
        const gradeCell = cells[gradeCol];
        if (!course || course.nonCredit || !gradeCell) continue;

        const original = Array.from(gradeCell.childNodes);
        const select = gradeSelect(['', ...LETTER_GRADES.filter((g) => g !== 'A+'), 'W'], (v) => {
          whatIf[code] = v as Grade | '';
          update();
        });
        select.setAttribute('aria-label', `What-if grade for ${code}`);
        gradeCell.replaceChildren(select);
        pickers.set(code, select);
        restore.push(() => gradeCell.replaceChildren(...original));

        const prior = priorAttempt(semesters, currentIndex, code);
        const remarksCell = cells[remarksCol];
        if (prior && remarksCell) {
          const chip = el('span', { className: 'df-tx-chip', textContent: `replaces ${prior.grade} (${prior.term.label})` });
          remarksCell.append(chip);
          restore.push(() => chip.remove());
        }
      }
    }
  }

  // --- live header numbers for the in-progress semester --------------------
  const statSpans = current ? statLine(current.term.label) : null;
  const originalStats = statSpans?.map((s) => s.textContent);
  if (statSpans) {
    restore.push(() =>
      statSpans.forEach((s, i) => {
        s.textContent = originalStats![i] ?? '';
        s.classList.remove('df-tx-live');
        if (!s.className) s.removeAttribute('class');
      }),
    );
  }

  function setAll(g: Grade | '') {
    for (const [code, select] of pickers) {
      select.value = g;
      whatIf[code] = g;
    }
    update();
  }

  function update() {
    const overrides: Record<string, Grade> = {};
    if (current) for (const [code, g] of Object.entries(whatIf)) if (g) overrides[attemptKey(current.term, code)] = g;
    let sems: TranscriptSemester[] = applyOverrides(semesters, overrides);
    const planned = Object.entries(repeats).filter(([, g]) => g) as [string, LetterGrade][];
    if (planned.length) {
      const counted = countedGrades(semesters);
      sems = [
        ...sems,
        {
          term: PLANNED_TERM,
          flexStats: null,
          courses: planned.map(([code, g]) => ({
            code,
            name: counted.get(code)?.name ?? code,
            section: '',
            credits: counted.get(code)?.credits ?? 3,
            grade: g,
            points: GRADE_POINTS[g],
            type: 'Core',
            remarks: 'Planned',
            nonCredit: false,
          })),
        },
      ];
    }
    const after = computeStandings(sems, rules);
    const now = before.at(-1)?.cgpa ?? 0;
    const next = after.at(-1)?.cgpa ?? now;
    cgpaValue.textContent = fmt2(next);
    const d = next - now;
    delta.textContent = Math.abs(d) < 0.005 ? `now ${fmt2(now)}` : `${d > 0 ? '▲' : '▼'} ${fmt2(Math.abs(d))} from ${fmt2(now)}`;
    delta.className = `df-tx-delta ${d > 0.004 ? 'up' : d < -0.004 ? 'down' : ''}`;
    const sem = currentIndex >= 0 ? after[currentIndex] : null;
    sgpaValue.textContent = sem && sem.semesterCredits ? fmt2(sem.sgpa) : '—';

    if (statSpans && sem) {
      const [, , cgpaSpan, sgpaSpan] = statSpans;
      if (cgpaSpan) cgpaSpan.textContent = `CGPA:${fmt2(sem.cgpa)}`;
      if (sgpaSpan) sgpaSpan.textContent = `SGPA:${sem.semesterCredits ? fmt2(sem.sgpa) : '0'}`;
      statSpans.forEach((s) => s.classList.toggle('df-tx-live', Object.values(whatIf).some(Boolean)));
    }
  }

  update();
  return () => restore.reverse().forEach((fn) => fn());
}

function findSemesterBlock(label: string): Element | null {
  const heading = Array.from(document.querySelectorAll('h5')).find((h) => cleanText(h.textContent) === label);
  let node = heading?.parentElement ?? null;
  while (node && !node.querySelector('table')) node = node.parentElement;
  return node;
}

/** The four spans "Cr. Att / Cr. Ernd / CGPA / SGPA" above a semester's table. */
function statLine(label: string): HTMLElement[] | null {
  const block = findSemesterBlock(label);
  const spans = Array.from(block?.querySelectorAll<HTMLElement>('.pull-right span') ?? []);
  return spans.length >= 4 ? spans : null;
}

function gradeSelect(values: string[], onchange: (value: string) => void): HTMLSelectElement {
  const select = el('select', { className: 'df-grade' });
  for (const v of values) select.append(el('option', { value: v, textContent: v || '—' }));
  select.addEventListener('change', () => onchange(select.value));
  return select;
}

function button(text: string, onclick: () => void): HTMLButtonElement {
  const b = el('button', { type: 'button', className: 'df-tx-btn', textContent: text });
  b.addEventListener('click', onclick);
  return b;
}
