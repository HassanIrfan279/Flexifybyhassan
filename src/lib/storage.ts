import { storage, type WxtStorageItem } from 'wxt/utils/storage';
import type { CourseAttendance } from './flex/attendance';
import type { FeedbackCourse } from './flex/feedback';
import type { CourseMarks } from './flex/marks';
import type { StudentProfile } from './flex/profile';
import type { PlannedSemester } from './flex/studyplan';
import type { Transcript } from './flex/transcript';

/**
 * Data is cached when the student opens a Flex page normally. Flexify never
 * crawls the portal in the background: rapid requests end the Flex session.
 */
export interface Captured<T> {
  capturedAt: string;
  data: T;
}

/** The student's own identity, used only to sign query emails. Stays on this device. */
export interface Identity {
  name: string;
  rollNo: string;
  /** Profile photo from Flex as a small JPEG data URL. */
  photo?: string;
}

interface StoreData {
  profile: StudentProfile;
  identity: Identity;
  transcript: Transcript;
  marks: CourseMarks[];
  attendance: CourseAttendance[];
  studyPlan: PlannedSemester[];
  feedback: { active: boolean; courses: FeedbackCourse[] };
}

export type StoreKey = keyof StoreData;

type Stores = { [K in StoreKey]: WxtStorageItem<Captured<StoreData[K]> | null, {}> };

const item = <K extends StoreKey>(key: K) =>
  storage.defineItem<Captured<StoreData[K]> | null>(`local:${key}`, { fallback: null });

export const stores: Stores = {
  profile: item('profile'),
  identity: item('identity'),
  transcript: item('transcript'),
  marks: item('marks'),
  attendance: item('attendance'),
  studyPlan: item('studyPlan'),
  feedback: item('feedback'),
};

export function save<K extends StoreKey>(key: K, data: StoreData[K]): Promise<void> {
  return stores[key].setValue({ capturedAt: new Date().toISOString(), data });
}

export type Snapshot = { [K in StoreKey]: Captured<StoreData[K]> | null };

export async function loadSnapshot(): Promise<Snapshot> {
  const keys = Object.keys(stores) as StoreKey[];
  const values = await Promise.all(keys.map((k) => stores[k].getValue()));
  return Object.fromEntries(keys.map((k, i) => [k, values[i]])) as Snapshot;
}

/** Calls `onChange` whenever any cached Flex data changes (e.g. the student opens a Flex page). */
export function watchSnapshot(onChange: () => void): () => void {
  const unwatchers = (Object.keys(stores) as StoreKey[]).map((k) => stores[k].watch(onChange));
  return () => unwatchers.forEach((u) => u());
}

export interface Settings {
  /** Master switch: when off, Flexify neither reads nor changes Flex pages. */
  enabled: boolean;
  /** Required attendance, 0–1. */
  minAttendance: number;
  /** CGPA below this triggers a warning. */
  minCgpa: number;
  repeatPolicy: 'latest' | 'best';
  maxCoursesRegular: number;
  maxCoursesSummer: number;
  /** Fee per credit hour in PKR. */
  feePerCredit: number;
  darkFlex: boolean;
  /** Teacher emails the student confirmed, by course code. */
  teacherEmails: Record<string, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  minAttendance: 0.8,
  minCgpa: 2,
  repeatPolicy: 'latest',
  maxCoursesRegular: 5,
  maxCoursesSummer: 2,
  feePerCredit: 11000,
  darkFlex: false,
  teacherEmails: {},
};

export const settingsItem = storage.defineItem<Settings>('local:settings', { fallback: DEFAULT_SETTINGS });

export async function loadSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await settingsItem.getValue()) };
}

/**
 * A running "fill all feedback" job. The Flex tab's content script advances it
 * one form per page load, exactly as if the student clicked through.
 */
export interface FeedbackJob {
  /** 1–5, where 5 is the most positive option on the form. */
  rating: number;
  /** Comment for any required free-text box. */
  comment: string;
  /** Course codes still to do, in order. */
  queue: string[];
  done: string[];
  failed: { code: string; reason: string }[];
  /** Visits to each course's form, to avoid looping on a form Flex rejects. */
  attempts?: Record<string, number>;
  /** The exact form page the job opened last (path + query); only that page is filled. */
  expectedPath?: string;
  /** Set just before clicking Submit; seeing the same form again means Flex rejected it. */
  submittedPath?: string;
  status: 'running' | 'finished' | 'stopped';
  startedAt: string;
}

export const feedbackJobItem = storage.defineItem<FeedbackJob | null>('local:feedbackJob', { fallback: null });
