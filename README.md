<p align="center"><img src="assets/logo.webp" alt="Flexify" width="240"></p>

<h1 align="center">Flexify</h1>
<p align="center"><b>by Hassan Irfan</b></p>
<p align="center">A smarter FLEX student portal for FAST-NUCES students: GPA with repeats, warning planner, marks, absences, prerequisites and one-click course feedback.</p>

<p align="center">
  <a href="../../releases/latest"><b>⬇ Download the latest version</b></a>
</p>

> Flexify is an independent project made by **Hassan Irfan**. It is not affiliated with or endorsed by FAST-NUCES.

<!-- DEMO VIDEO: edit this file on GitHub and drag your .mp4 (under 10 MB) onto this line. -->

---

## What Flexify does

Flexify adds tools on top of the FLEX portal (`flexstudent.nu.edu.pk`) that FLEX doesn't have. It works for **all degree programmes**, not only CS.

### In the toolbar popup

Click the Flexify icon in Chrome's toolbar to open the popup. It has seven tabs:

| Tab | What you get |
|---|---|
| **Home** | Your photo, name, roll number, CGPA, warning status and absences at a glance. Also has **two-click course feedback**, a shortcut to your admit card, and a **dark mode** switch for FLEX. |
| **Warning** | Your warning history (summer semesters included) and the **easiest grade combinations** that bring your CGPA back above 2.00. |
| **Marks** | Grand totals per course, how you compare with the class, marks that haven't been uploaded yet, and **what you need in the final**. |
| **Absences** | Absence count for every course. If one looks wrong, Flexify writes a **ready-made email to your teacher**. |
| **Prereqs** | Every course on your roadmap checked against its prerequisites, and what each course unlocks. |
| **Degree** | The fastest path to graduation that respects prerequisites, with or without summer semesters, compared with your on-time graduation date. |
| **Settings** | Turn Flexify on or off, set FLEX dark mode, choose how repeated courses count, set course limits per semester, fee per credit hour, and clear all saved data. |

### Inside FLEX itself

| FLEX page | What Flexify adds |
|---|---|
| **Transcript** | A **GPA calculator** built into the page. Try what-if grades, withdrawals and planned repeats. Repeated courses replace the earlier grade, the same way FAST counts them. |
| **Marks** | A summary bar, the Grand Total filled in, and ✉ buttons that write a query email to your teacher. |
| **Attendance** | A summary bar and ✉ buttons for attendance queries. |

---

## How it works

1. **Log in to FLEX normally.** Flexify never asks for your password and never logs in for you.
2. **Open your FLEX pages once:** transcript, marks and attendance. As you open each page, Flexify reads it and saves the data **on your own computer**.
3. **Open the Flexify popup.** Everything you've visited now appears in the tabs. Revisit a FLEX page whenever you want Flexify to pick up new marks or attendance.

**Why it doesn't load everything automatically:** FLEX logs you out if too many pages are requested quickly. Flexify only reads pages that you open yourself, so your session stays safe.

**Your data stays private:** everything is stored in your browser. Flexify does not send your data to any server, including the developer's. See [PRIVACY.md](PRIVACY.md).

---

## Installation (about 2 minutes)

> ⚠️ **Don't use the green "Code → Download ZIP" button.** That gives you the source code, which Chrome can't load. Download the ready-made zip from **Releases** as described below.

1. **Download:** go to the [**latest release**](../../releases/latest) and click **`flexify-x.x.x-chrome.zip`** under *Assets*.
2. **Extract:** right-click the zip, choose **Extract All…**, then click **Extract**.
   Put the extracted folder somewhere permanent, such as `Documents\Flexify`. **If you delete or move this folder later, the extension stops working.**
3. **Open the extensions page:** type `chrome://extensions` in the address bar and press Enter.
4. **Turn on Developer mode** with the toggle in the top-right corner.
5. **Click "Load unpacked"** and select the extracted folder.
   > Select the folder that **directly contains `manifest.json`**. If you see another folder inside, open it and select that one instead.
6. **Pin it:** click the 🧩 puzzle icon in Chrome's toolbar, then the 📌 pin next to **Flexify**.

Done. Open [FLEX](https://flexstudent.nu.edu.pk), log in, and visit your transcript page to get started.

Flexify also works in **Microsoft Edge** and **Brave**. Use `edge://extensions` or `brave://extensions` instead.

---

## How to use it

### Check your GPA or plan your grades
Open **Transcript** in FLEX. The GPA calculator appears on the page. Change any grade to see how it affects your SGPA and CGPA, mark a course as withdrawn, or add a planned repeat.

### Get out of a warning
Visit your transcript, then open the popup's **Warning** tab. It lists the easiest grade combinations that bring your CGPA back to 2.00 or higher.

### See what you need in the final
Open **Marks** in FLEX for each course, then check the popup's **Marks** tab.

### Report wrong marks or attendance
On the FLEX Marks or Attendance page, click the **✉** button next to the entry. Flexify opens an email to your teacher that's already written. Check it and send it.

### Fill course feedback in two clicks
1. In the popup's **Home** tab, find the feedback card.
2. Choose one rating for every question (e.g. *4 · Agree*).
3. Click **Fill & submit all**, then **Confirm**.

Keep the FLEX tab open while it works. It fills one form at a time at a normal pace, and you can click **Stop** at any time. Feedback can't be changed after it's submitted, so check your rating before confirming.

### Plan your degree
Visit your transcript, then open the **Prereqs** and **Degree** tabs. Prerequisite data comes from FAST course outlines and roadmaps. **Always confirm your plan with your academic office.**

### Turn it off
Use the switch at the top of the popup to turn Flexify off without uninstalling it.

---

## Updating to a new version

Extensions installed this way **don't update automatically**.

1. Download the newest zip from [Releases](../../releases/latest).
2. Delete the old Flexify folder and extract the new one **in the same location**.
3. Go to `chrome://extensions` and click the **↻ reload** icon on Flexify.

Your saved data and settings are kept.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| *"Manifest file is missing or unreadable"* | You selected the wrong folder. Select the one that directly contains `manifest.json`. |
| The popup is empty or shows old data | Open your transcript, marks and attendance pages in FLEX again, then reopen the popup. |
| Flexify disappeared from Chrome | The folder was moved or deleted. Extract it again and click **Load unpacked**. |
| *"Disable developer mode extensions"* popup when Chrome starts | Click ✕. This is normal for extensions installed manually. |
| Nothing changes on FLEX | Make sure the switch at the top of the popup is on, then refresh the FLEX page. |

Found a bug or have an idea? [Open an issue](../../issues).

---

## Credits

**Flexify is designed and built by [Hassan Irfan](https://github.com/HassanIrfan279)**, a CS student at FAST-NUCES.

Inspired by [Jugaadu Flex](https://github.com/fahadsheikh003/Jugaadu-Flex-2). Flexify is an independent rewrite from scratch.

Licensed under the [MIT License](LICENSE).

---

<details>
<summary><b>For developers</b></summary>

### How it's built

- A content script reads each FLEX page **when the student opens it** and caches the data in extension storage. Flexify never crawls FLEX, because fast background requests end the FLEX session.
- Course feedback runs as a small job inside the student's FLEX tab: one form per page load at a human pace, only in the tab that started it, never submitting the same form twice, and expiring after 15 minutes.
- Parsers find columns by header text, not position, so they keep working across programmes.
- Design follows a 60-30-10 rule: near-black navy with a particle field (60%), frosted navy panels and a solid tab bar (30%), neon cyan for active states, primary actions and key numbers (10%).

```
src/
  entrypoints/
    popup/                 toolbar popup (tabs/)
    flex.content/          page reading + in-page tools (transcript GPA, marks, attendance, feedback, admit card)
    dark.content.ts        Flex dark mode at document_start
  lib/
    flex/                  page parsers and the feedback-form filler
    gpa/                   GPA engine, warning history + planner (+ web worker)
    plan/                  degree progress, prerequisites (+ data), timeline scheduler
    ui/                    theme, particle field, components
fixtures/                  Flex page layouts with a fictional student, used by tests (never shipped)
preview/                   run the popup / Flex pages locally with fixture data
```

### Commands

```bash
npm install
npm run dev            # Chrome with hot reload
npm test               # unit tests against Flex page layouts filled with a fictional student
npm run check          # type-check
npm run verify         # check + test + both builds + Firefox lint (what CI runs)
npm run preview:ui     # popup at http://localhost:5199 (?demo=1 for a fictional student)
npm run zip            # .output/flexify-<version>-chrome.zip  (attach this to a GitHub Release)
npm run zip:firefox    # firefox zip + sources zip for AMO review
npm run icons          # re-render icons from assets/icon.svg
```

CI (`.github/workflows/ci.yml`) type-checks, tests, builds both browsers, lints the Firefox build, rejects `eval` in the bundle, audits runtime dependencies and uploads the packages.

Store text and assets: [`store/`](store/LISTING.md). Privacy policy: [`PRIVACY.md`](PRIVACY.md).

### Prerequisite data

`src/lib/plan/prerequisites.data.json` is compiled from FAST course outlines and the published roadmaps (sources inside the file). FAST does not publish one official list under the current codes, so the popup asks students to confirm with their academic office.

</details>
