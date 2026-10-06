// Dev-only harness: renders the side panel in a normal browser tab with data
// parsed from /fixtures, so the UI can be checked without loading the extension.
import { mount } from 'svelte';
import '@/lib/ui/theme.css';
import { parseAttendance } from '@/lib/flex/attendance';
import { parseMarks } from '@/lib/flex/marks';
import { parseIdentity, parseProfile } from '@/lib/flex/profile';
import { parseStudyPlan } from '@/lib/flex/studyplan';
import { parseTranscript } from '@/lib/flex/transcript';
import { feedbackJobItem, save } from '@/lib/storage';
import App from '@/entrypoints/popup/App.svelte';
import { demoAttendance, demoMarks, demoTranscript } from './demo';

// ?demo=1 swaps in a fictional student (for public screenshots); ?tab=… opens a tab.
const params = new URLSearchParams(location.search);
const demo = params.has('demo');
// ?fixture keeps the (fictional) fixture student's records while still using the demo identity and feedback.
const demoData = demo && !params.has('fixture');
const tab = params.get('tab');
if (tab) localStorage.setItem('df-tab', tab);
// Headless screenshots can't wait for a Web Worker; ?sync makes the planner run inline.
if (params.has('sync')) (window as { Worker?: unknown }).Worker = undefined;

const load = async (name: string) =>
  new DOMParser().parseFromString(await (await fetch(`/fixtures/${name}`)).text(), 'text/html');

const [home, transcript, marks, attendance, plan] = (await Promise.all(
  ['home.html', 'transcript.html', 'marks.html', 'attendance.html', 'studyplan.html'].map(load),
)) as [Document, Document, Document, Document, Document];
await save('profile', parseProfile(home));
await save('identity', demo ? { name: 'Ayesha Khan', rollNo: '24L-1234' } : (parseIdentity(home) ?? { name: 'Student Name', rollNo: '24X-0000' }));
await save('transcript', demoData ? demoTranscript(parseTranscript(transcript)) : parseTranscript(transcript));
await save('marks', demoData ? demoMarks(parseMarks(marks)) : parseMarks(marks));
await save('attendance', demoData ? demoAttendance(parseAttendance(attendance)) : parseAttendance(attendance));
await save('studyPlan', parseStudyPlan(plan));
if (demo) {
  // A feedback window with five pending forms; ?job=running shows the job mid-way.
  const courses = ['CL2001', 'CS1005', 'CS2001', 'NS1001', 'SS1007'].map((code, i) => ({
    code,
    name: code,
    credits: 3,
    submitted: params.get('job') === 'running' && i < 3,
    formPath: `/Student/FeedBackQuestions?id=${i + 1}`,
  }));
  await save('feedback', { active: true, courses });
  if (params.get('job') === 'running') {
    await feedbackJobItem.setValue({
      rating: 5,
      comment: '',
      queue: ['NS1001', 'SS1007'],
      done: ['CL2001', 'CS1005', 'CS2001'],
      failed: [],
      status: 'running',
      startedAt: new Date().toISOString(),
    });
  }
}

mount(App, { target: document.getElementById('app')! });

// ?scroll=N scrolls the panel after it renders (store screenshots).
const scroll = Number(params.get('scroll') ?? 0);
if (scroll) setTimeout(() => (document.querySelector('main') ?? document.scrollingElement)?.scrollTo(0, scroll), 1200);

// ?click=Label presses a button once rendered (to stage a what-if for screenshots).
const click = params.get('click');
if (click) setTimeout(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === click)?.click(), 800);
