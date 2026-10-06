import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { feedbackJobItem, type FeedbackJob } from '@/lib/storage';
import { continueFeedbackJob } from './feedback-run';

const FORM = '/Student/FeedBackQuestions?id=7';

function formPage() {
  document.body.innerHTML = `<h4>CS2001-Data Structures (BCS-3E)</h4><form>
    ${[1, 2].map((q) => [1, 2, 3, 4, 5].map((v) => `<label><input type="radio" name="q${q}" value="${v}">${v}</label>`).join('')).join('')}
    <button type="submit">Submit</button></form>`;
}

function job(over: Partial<FeedbackJob> = {}): FeedbackJob {
  return {
    rating: 5,
    comment: 'Thanks',
    queue: ['CS2001'],
    done: [],
    failed: [],
    status: 'running',
    startedAt: new Date().toISOString(),
    expectedPath: FORM,
    ...over,
  };
}

describe('feedback job safety', () => {
  let assign: ReturnType<typeof vi.fn<(url: string | URL) => void>>;
  let submits: number;

  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
    (window as unknown as { happyDOM: { setURL(url: string): void } }).happyDOM.setURL(`https://flexstudent.nu.edu.pk${FORM}`);
    formPage();
    submits = 0;
    document.querySelector('button')!.addEventListener('click', (e) => {
      e.preventDefault();
      submits++;
    });
    assign = vi.fn<(url: string | URL) => void>();
    vi.spyOn(window.location, 'assign').mockImplementation(assign);
  });

  const run = async () => {
    const p = continueFeedbackJob();
    await vi.runAllTimersAsync();
    await p;
  };

  it('fills and submits the expected form once, in the tab that owns the job', async () => {
    const j = job();
    sessionStorage.setItem('flexify-feedback-owner', j.startedAt);
    await feedbackJobItem.setValue(j);
    await run();
    expect(submits).toBe(1);
    expect(Array.from(document.querySelectorAll<HTMLInputElement>('input:checked')).map((i) => i.value)).toEqual(['5', '5']);
    expect((await feedbackJobItem.getValue())?.submittedPath).toBe(FORM);
  });

  it('never submits the same form twice', async () => {
    const j = job({ submittedPath: FORM });
    sessionStorage.setItem('flexify-feedback-owner', j.startedAt);
    await feedbackJobItem.setValue(j);
    await run();
    expect(submits).toBe(0);
    const after = await feedbackJobItem.getValue();
    expect(after?.failed[0]?.code).toBe('CS2001');
    expect(assign).toHaveBeenCalledWith('/Student/CourseFeedback');
  });

  it('does nothing in a tab that did not start the job', async () => {
    sessionStorage.setItem('flexify-feedback-owner', 'someone-else');
    await feedbackJobItem.setValue(job());
    await run();
    expect(submits).toBe(0);
    expect(assign).not.toHaveBeenCalled();
  });

  it('refuses a form for a different course', async () => {
    const j = job({ queue: ['MT1003'] });
    sessionStorage.setItem('flexify-feedback-owner', j.startedAt);
    await feedbackJobItem.setValue(j);
    await run();
    expect(submits).toBe(0);
    expect((await feedbackJobItem.getValue())?.failed[0]?.reason).toBe('Unexpected form');
  });

  it('expires an old job instead of resuming it', async () => {
    const j = job({ startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() });
    sessionStorage.setItem('flexify-feedback-owner', j.startedAt);
    await feedbackJobItem.setValue(j);
    await run();
    expect(submits).toBe(0);
    expect((await feedbackJobItem.getValue())?.status).toBe('stopped');
  });
});
