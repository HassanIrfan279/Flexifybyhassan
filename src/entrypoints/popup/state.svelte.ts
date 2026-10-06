import { DEFAULT_SETTINGS, feedbackJobItem, loadSettings, loadSnapshot, settingsItem, watchSnapshot, type FeedbackJob, type Settings, type Snapshot } from '@/lib/storage';

export const app = $state<{ snapshot: Snapshot | null; settings: Settings; feedbackJob: FeedbackJob | null; ready: boolean }>({
  snapshot: null,
  settings: DEFAULT_SETTINGS,
  feedbackJob: null,
  ready: false,
});

/** Loads cached Flex data and settings, and keeps them live as the student browses Flex. */
export async function initState() {
  const refresh = async () => {
    app.snapshot = await loadSnapshot();
  };
  [app.settings, app.feedbackJob] = await Promise.all([loadSettings(), feedbackJobItem.getValue(), refresh()]);
  feedbackJobItem.watch((job) => (app.feedbackJob = job));
  app.ready = true;
  watchSnapshot(refresh);
  settingsItem.watch(async () => {
    app.settings = await loadSettings();
  });
}

export async function updateSettings(patch: Partial<Settings>) {
  app.settings = { ...app.settings, ...patch };
  await settingsItem.setValue($state.snapshot(app.settings));
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function ago(iso: string | undefined): string {
  if (!iso) return 'never';
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return RELATIVE.format(hours, 'hour');
  return RELATIVE.format(Math.round(hours / 24), 'day');
}

export const FLEX_URL = 'https://flexstudent.nu.edu.pk/';
