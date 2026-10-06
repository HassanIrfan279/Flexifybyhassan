import { browser } from 'wxt/browser';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { parseAttendance } from '@/lib/flex/attendance';
import { parseFeedbackList } from '@/lib/flex/feedback';
import { parseMarks } from '@/lib/flex/marks';
import { parseIdentity, parseProfile } from '@/lib/flex/profile';
import { parseStudyPlan } from '@/lib/flex/studyplan';
import { parseTranscript } from '@/lib/flex/transcript';
import { loadSettings, save, settingsItem, stores, type Settings } from '@/lib/storage';
import '@/lib/ui/theme.css';
import { downloadAdmitCard } from './admit-card';
import { enhanceAttendancePage } from './attendance-page';
import { removeAddedElements } from './dom';
import { continueFeedbackJob, startFeedbackJob, stopFeedbackJob } from './feedback-run';
import { enhanceMarksPage } from './marks-page';
import { capturePhoto } from './photo';
import { enhanceTranscriptPage } from './transcript-page';

/**
 * Runs on every Flex page the student opens. When Flexify is on, it caches
 * that page's data for the popup and adds Flexify's helpers to the page. It
 * never requests other Flex pages on its own.
 */
export default defineContentScript({
  matches: ['https://flexstudent.nu.edu.pk/*'],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    let teardowns: (() => void)[] = [];
    let active = false;

    const start = async (settings: Settings) => {
      if (active) return;
      active = true;
      teardowns = await enhance(ctx, settings);
    };
    const stop = () => {
      if (!active) return;
      active = false;
      teardowns.forEach((fn) => fn());
      teardowns = [];
      removeAddedElements();
    };

    // Only Flexify's own popup may ask this page to act.
    browser.runtime.onMessage.addListener((msg: unknown, sender) => {
      if (sender.id !== browser.runtime.id || !active || typeof msg !== 'object' || msg === null) return;
      const m = msg as { type?: unknown; card?: unknown };
      if (m.type === 'df:admit-card' && typeof m.card === 'string') return downloadAdmitCard(m.card);
      if (m.type === 'df:feedback-start') return startFeedbackJob();
      if (m.type === 'df:feedback-stop') return stopFeedbackJob();
    });

    const settings = await loadSettings();
    if (settings.enabled) await start(settings);
    settingsItem.watch(async (next) => {
      if (next?.enabled) await start({ ...settings, ...next });
      else stop();
    });
  },
});

async function enhance(ctx: ContentScriptContext, settings: Settings) {
  const teardowns: (() => void)[] = [];
  const path = location.pathname.toLowerCase();

  const identity = parseIdentity(document);
  if (identity?.rollNo) {
    const previous = (await stores.identity.getValue())?.data;
    const photo = (await capturePhoto()) ?? previous?.photo;
    await save('identity', { ...identity, ...(photo && { photo }) });
  }

  if (path === '/' || path.startsWith('/home')) {
    const profile = parseProfile(document);
    if (profile.degree) await save('profile', profile);
  } else if (path.startsWith('/student/transcript')) {
    const transcript = parseTranscript(document);
    if (transcript.semesters.length) {
      await save('transcript', transcript);
      teardowns.push(enhanceTranscriptPage(transcript, { repeatPolicy: settings.repeatPolicy }));
    }
  } else if (path.startsWith('/student/studentmarks')) {
    const marks = parseMarks(document);
    if (marks.length) await save('marks', marks);
    await enhanceMarksPage(ctx, marks);
  } else if (path.startsWith('/student/studentattendance')) {
    const attendance = parseAttendance(document);
    if (attendance.length) await save('attendance', attendance);
    await enhanceAttendancePage(ctx, attendance);
  } else if (path.startsWith('/student/tentativestudyplan')) {
    const plan = parseStudyPlan(document);
    if (plan.length) await save('studyPlan', plan);
  } else if (path.startsWith('/student/coursefeedback')) {
    const feedback = parseFeedbackList(document);
    if (feedback.courses.length) await save('feedback', feedback);
  }

  // A "fill all feedback" job, if one is running, moves one step per page load.
  await continueFeedbackJob();
  return teardowns;
}
