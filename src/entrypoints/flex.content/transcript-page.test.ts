import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { parseTranscript } from '@/lib/flex/transcript';
import { enhanceTranscriptPage } from './transcript-page';

const html = readFileSync(resolve(__dirname, '../../../fixtures/transcript.html'), 'utf-8');

describe('enhanceTranscriptPage', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = new DOMParser().parseFromString(html, 'text/html').documentElement.innerHTML;
  });

  it('adds grade pickers to the in-progress semester and labels repeats', () => {
    enhanceTranscriptPage(parseTranscript(document), { repeatPolicy: 'latest' });
    expect(document.querySelectorAll('select.df-grade:not(.df-tx-repeat select)').length).toBeGreaterThanOrEqual(5);
    const chips = Array.from(document.querySelectorAll('.df-tx-chip')).map((c) => c.textContent);
    expect(chips).toContain('replaces F (Spring 2026)');
    expect(document.querySelector('.df-tx-big')?.textContent).toBe('1.76');
  });

  it('projects CGPA from the chosen grades, like the GPA engine', () => {
    enhanceTranscriptPage(parseTranscript(document), { repeatPolicy: 'latest' });
    const allB = Array.from(document.querySelectorAll<HTMLButtonElement>('.df-tx-btn')).find((b) => b.textContent === 'All B')!;
    allB.click();
    expect(document.querySelector('.df-tx-big')?.textContent).toBe('2.13');
    expect(document.querySelector('.df-tx-mid')?.textContent).toBe('3.00');
    expect(document.querySelector('.df-tx-delta')?.textContent).toContain('0.37');
  });

  it('restores the page exactly when turned off', () => {
    const before = document.body.innerHTML;
    const restore = enhanceTranscriptPage(parseTranscript(document), { repeatPolicy: 'latest' });
    expect(document.body.innerHTML).not.toBe(before);
    restore();
    expect(document.body.innerHTML).toBe(before);
  });
});
