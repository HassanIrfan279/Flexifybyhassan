import { parseFeedbackList } from '@/lib/flex/feedback';
import { fillFeedbackForm, findSubmitButton, formCourseCode } from '@/lib/flex/feedback-form';
import { feedbackJobItem, save, type FeedbackJob } from '@/lib/storage';

const LIST_PATH = '/Student/CourseFeedback';
/** Pause between steps, so Flex sees a human pace (rapid requests end the session). */
const STEP_DELAY_MS = 1500;
/** Give up on a course after this many visits to its form. */
const MAX_ATTEMPTS = 2;
/** A job older than this is abandoned, so it can never resume days later. */
const JOB_TTL_MS = 15 * 60 * 1000;
/** Marks the one tab that runs the job (sessionStorage is per tab). */
const OWNER_KEY = 'flexify-feedback-owner';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const here = () => location.pathname + location.search;
const isListPage = () => location.pathname.toLowerCase() === LIST_PATH.toLowerCase();

function ownsJob(job: FeedbackJob): boolean {
  try {
    return sessionStorage.getItem(OWNER_KEY) === job.startedAt;
  } catch {
    return false;
  }
}

/** Called from the popup: this tab becomes the job's only runner. */
export async function startFeedbackJob(): Promise<{ ok: boolean; error?: string }> {
  const job = await feedbackJobItem.getValue();
  if (!job || job.status !== 'running') return { ok: false, error: 'Nothing to do.' };
  try {
    sessionStorage.setItem(OWNER_KEY, job.startedAt);
  } catch {
    return { ok: false, error: 'This tab cannot run the job.' };
  }
  if (isListPage()) void continueFeedbackJob();
  else location.assign(LIST_PATH);
  return { ok: true };
}

export async function stopFeedbackJob(): Promise<{ ok: boolean }> {
  const job = await feedbackJobItem.getValue();
  if (job) await feedbackJobItem.setValue({ ...job, status: 'stopped' });
  return { ok: true };
}

async function current(): Promise<FeedbackJob | null> {
  const job = await feedbackJobItem.getValue();
  if (!job || job.status !== 'running' || !ownsJob(job)) return null;
  if (Date.now() - Date.parse(job.startedAt) > JOB_TTL_MS) {
    await feedbackJobItem.setValue({ ...job, status: 'stopped' });
    return null;
  }
  return job;
}

/** One step of the running job for the page that just loaded (only in the tab that started it). */
export async function continueFeedbackJob(): Promise<void> {
  if (!(await current())) return;
  await sleep(STEP_DELAY_MS);
  const job = await current(); // the student may have pressed Stop meanwhile
  if (!job) return;

  if (isListPage()) return stepOnList(job);
  if (job.expectedPath && here() === job.expectedPath) return stepOnForm(job);
  // Anywhere else (the student navigated away, or Flex redirected): back to the list.
  location.assign(LIST_PATH);
}

async function stepOnList(job: FeedbackJob) {
  const list = parseFeedbackList(document);
  await save('feedback', list);

  // Courses that now show as submitted are done.
  const submitted = new Set(list.courses.filter((c) => c.submitted).map((c) => c.code));
  const done = [...job.done, ...job.queue.filter((c) => submitted.has(c))];
  let queue = job.queue.filter((c) => !submitted.has(c));
  const failed = [...job.failed];
  const attempts = { ...job.attempts };

  // Open the next course that still has a form link.
  while (queue.length) {
    const next = queue[0]!;
    const course = list.courses.find((c) => c.code === next);
    attempts[next] = (attempts[next] ?? 0) + 1;
    if (course?.formPath && attempts[next]! <= MAX_ATTEMPTS) {
      await feedbackJobItem.setValue({ ...job, queue, done, failed, attempts, expectedPath: course.formPath, submittedPath: undefined });
      location.assign(course.formPath);
      return;
    }
    failed.push({ code: next, reason: course?.formPath ? 'Flex did not accept the form' : 'No feedback form found' });
    queue = queue.slice(1);
  }
  await feedbackJobItem.setValue({ ...job, queue, done, failed, attempts, expectedPath: undefined, status: 'finished' });
}

async function stepOnForm(job: FeedbackJob) {
  const expected = job.queue[0];
  const fail = async (reason: string) => {
    await feedbackJobItem.setValue({
      ...job,
      queue: job.queue.slice(1),
      failed: [...job.failed, { code: expected ?? '?', reason }],
      expectedPath: undefined,
      submittedPath: undefined,
    });
    location.assign(LIST_PATH);
  };

  // Back on a form we already submitted: Flex rejected it. Never submit twice.
  if (job.submittedPath === here()) return fail('Flex did not accept the form');
  // The form must be for the course we opened it for.
  const code = formCourseCode(document);
  if (!expected || (code && code !== expected)) return fail('Unexpected form');

  const filled = fillFeedbackForm(document, job.rating, job.comment);
  const submit = findSubmitButton(document);
  if (!filled.questions || filled.answered < filled.questions || !submit) {
    return fail(!filled.questions ? 'No questions found' : !submit ? 'No submit button' : 'Some questions could not be answered');
  }

  await sleep(400);
  const latest = await current(); // last check for Stop before the irreversible click
  if (!latest) return;
  await feedbackJobItem.setValue({ ...latest, submittedPath: here() });
  submit.click();
  // Flex returns to the list (or re-shows this form on error); the next page load continues.
}
