// End-to-end check of the BUILT extension in a real browser.
// Flex is never contacted: every https://flexstudent.nu.edu.pk/* page is answered with a
// fixture (a fictional student in Flex's real layout), so the content scripts run exactly
// as they would on Flex. Usage: npm run build && node scripts/e2e.mjs
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const BROWSER = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const EXT = resolve(process.env.EXT_DIR ?? '.output/chrome-mv3');
const FIX = resolve('fixtures');

const ROUTES = [
  ['/', 'home.html'],
  ['/Student/Transcript', 'transcript.html'],
  ['/Student/StudentMarks', 'marks.html'],
  ['/Student/StudentAttendance', 'attendance.html'],
  ['/Student/TentativeStudyPlan', 'studyplan.html'],
  ['/Student/CourseFeedback', 'feedback-list.html'],
];

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: BROWSER,
  headless: true,
  userDataDir: mkdtempSync(join(tmpdir(), 'flexify-e2e-')),
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, '--no-first-run', '--no-default-browser-check'],
  enableExtensions: [EXT],
});

const errors = [];
async function openFlex(path) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  // Only Flexify's own errors count: the fixtures' Flex scripts (jQuery, charts) are not served.
  page.on('pageerror', (e) => /chrome-extension:|flexify|df-/i.test(`${e.message} ${e.stack}`) && errors.push(`${path}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && /chrome-extension:|flexify/i.test(`${m.text()} ${m.location()?.url ?? ''}`) && errors.push(`${path} console: ${m.text()}`));
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.hostname !== 'flexstudent.nu.edu.pk') return req.continue();
    const route = ROUTES.find(([p]) => url.pathname.toLowerCase() === p.toLowerCase());
    if (route) return req.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: readFileSync(join(FIX, route[1]), 'utf-8') });
    return req.respond({ status: 404, body: '' }); // Flex assets: not needed for the logic under test
  });
  await page.goto(`https://flexstudent.nu.edu.pk${path}`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1500));
  return page;
}

// --- content scripts on each Flex page -------------------------------------------------------
let page = await openFlex('/');
await page.close();

page = await openFlex('/Student/Transcript');
check('transcript: GPA calculator panel added', !!(await page.$('.df-tx-panel')));
check('transcript: grade pickers in the current semester', (await page.$$('select.df-grade')).length >= 5);
const allB = await page.evaluateHandle(() => [...document.querySelectorAll('.df-tx-btn')].find((b) => b.textContent === 'All B'));
if (allB.asElement()) await allB.asElement().click();
await new Promise((r) => setTimeout(r, 200));
check('transcript: All B projects 2.13', (await page.$eval('.df-tx-big', (e) => e.textContent).catch(() => '')) === '2.13');
await page.close();

page = await openFlex('/Student/StudentMarks');
check('marks: summary strips added', (await page.$$('.df-summary')).length === 4);
check('marks: grand total filled', !!(await page.$('tr.df-total')));
check('marks: query buttons added', (await page.$$('.df-q')).length > 0);
const q = await page.$('.df-q');
if (q) await q.click();
await new Promise((r) => setTimeout(r, 800));
check('marks: query dialog opens', !!(await page.$('flexify-query')));
await page.close();

page = await openFlex('/Student/StudentAttendance');
check('attendance: query buttons on absences', (await page.$$('.df-q')).length > 0);
await page.close();

page = await openFlex('/Student/TentativeStudyPlan');
await page.close();
page = await openFlex('/Student/CourseFeedback');
await page.close();

// --- popup -------------------------------------------------------------------------------------
// An unpacked extension's id is derived from its folder path (SHA-256, first 32 hex digits mapped to a–p).
const idFrom = (bytes) => [...createHash('sha256').update(bytes).digest('hex').slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');
const candidates = [idFrom(Buffer.from(EXT, 'utf16le')), idFrom(Buffer.from(EXT, 'utf8')), idFrom(Buffer.from(EXT.toLowerCase(), 'utf16le'))];
let extId = null;
for (const id of candidates) {
  const p = await browser.newPage();
  const res = await p.goto(`chrome-extension://${id}/popup.html`).catch(() => null);
  const ok = !!res && (await p.evaluate(() => document.title).catch(() => '')) === 'Flexify';
  await p.close();
  if (ok) { extId = id; break; }
}
check('extension id found', !!extId, extId ?? '');

if (extId) {
  const popup = await browser.newPage();
  popup.on('pageerror', (e) => errors.push(`popup: ${e.message}`));
  popup.on('console', (m) => m.type() === 'error' && errors.push(`popup console: ${m.text()}`));
  await popup.setViewport({ width: 420, height: 600 });
  await popup.goto(`chrome-extension://${extId}/popup.html`);
  await new Promise((r) => setTimeout(r, 1500));
  const text = await popup.evaluate(() => document.body.innerText);
  check('popup: renders', text.includes('Flexify'));
  check('popup: shows the student', text.includes('24X-0000') || text.includes('Student'), text.slice(0, 120).replace(/\n/g, ' | '));
  check('popup: shows CGPA from the transcript', text.includes('1.76'));
  for (const tab of ['Warning', 'Marks', 'Absences', 'Prereqs', 'Degree', 'Settings']) {
    await popup.evaluate((t) => [...document.querySelectorAll('nav button')].find((b) => b.textContent.includes(t))?.click(), tab);
    await new Promise((r) => setTimeout(r, 400));
    const body = await popup.evaluate(() => document.querySelector('main')?.innerText ?? '');
    check(`popup tab ${tab}: has content`, body.trim().length > 40, body.slice(0, 80).replace(/\n/g, ' | '));
  }
  // The master switch turns Flexify off.
  await popup.evaluate(() => document.querySelector('header [role=switch]')?.click());
  await new Promise((r) => setTimeout(r, 400));
  check('popup: master switch turns off', (await popup.evaluate(() => document.body.innerText)).includes('Flexify is off'));
  await popup.close();
}

check('no page or console errors', errors.length === 0, errors.slice(0, 6).join(' || '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
