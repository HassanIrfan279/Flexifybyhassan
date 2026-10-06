// Captures 1280×800 Chrome Web Store screenshots from the preview server
// (npm run preview:ui must be running). Uses the fictional demo student.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = [
  ['1-warning', 'warning', 520, 'Know exactly what <em>clears your warning</em>', 'The minimum SGPA and the easiest grade combinations, with repeats counted the way FAST counts them.'],
  ['2-overview', 'overview', 0, 'Your Flex, <em>at a glance</em>', 'CGPA, warning status, absences, two-click course feedback and admit cards, one click from any tab.'],
  ['3-prereqs', 'prereqs', 0, 'Know what you can <em>register for</em>', 'Every course in your roadmap checked against its prerequisites: can take now, after this term, or blocked.'],
  ['4-degree', 'plan', 0, 'The fastest path <em>to graduation</em>', 'A prerequisite-aware plan at your course limits, with and without summers, against your batch’s on-time date.'],
  ['5-marks', 'marks', 0, 'The grand total Flex <em>leaves blank</em>', 'Your standing against the class, marks still to come, and what you need in the final.'],
];

for (const [file, tab, scroll, title, sub, click = ''] of SHOTS) {
  const url = `http://localhost:5199/store.html?${new URLSearchParams({ tab, scroll, title, sub, click })}`;
  execFileSync(CHROME, [
    '--headless=new',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1280,800',
    '--virtual-time-budget=8000',
    '--force-dark-mode',
    `--screenshot=${resolve('store', `${file}.png`)}`,
    url,
  ], { stdio: 'ignore' });
  console.log('captured', file);
}

// Promo tiles: small (required) and marquee (optional).
for (const [file, w, h] of [['promo-small-440x280', 440, 280], ['promo-marquee-1400x560', 1400, 560]]) {
  execFileSync(CHROME, [
    '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--virtual-time-budget=3000',
    `--screenshot=${resolve('store', `${file}.png`)}`,
    `http://localhost:5199/promo.html?w=${w}&h=${h}`,
  ], { stdio: 'ignore' });
  console.log('captured', file);
}
