import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { parseMarks } from '@/lib/flex/marks';
import { enhanceMarksPage } from './marks-page';

const html = readFileSync(resolve(__dirname, '../../../fixtures/marks.html'), 'utf-8');

describe('enhanceMarksPage', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = new DOMParser().parseFromString(html, 'text/html').documentElement.innerHTML;
  });

  it('adds a summary, fills Grand Total and adds query buttons', async () => {
    const courses = parseMarks(document);
    await enhanceMarksPage({} as ContentScriptContext, courses);

    // Four courses have marks; CS1005 has none and gets no strip.
    expect(document.querySelectorAll('.df-summary')).toHaveLength(4);

    const ds = document.getElementById('CS2001')!;
    const total = ds.querySelector('[id$="Grand_Total_Marks"] tbody tr.df-total')!;
    const cells = Array.from(total.querySelectorAll('td')).map((td) => td.textContent);
    expect(cells.slice(0, 2)).toEqual(['40.00', '22.20']);

    const rows = document.querySelectorAll('tr.calculationrow').length;
    expect(document.querySelectorAll('.df-q')).toHaveLength(rows);
  });

  it('is safe to run twice', async () => {
    const courses = parseMarks(document);
    await enhanceMarksPage({} as ContentScriptContext, courses);
    await enhanceMarksPage({} as ContentScriptContext, courses);
    expect(document.querySelectorAll('.df-summary')).toHaveLength(4);
    expect(document.querySelectorAll('.df-q')).toHaveLength(document.querySelectorAll('tr.calculationrow').length);
  });
});
