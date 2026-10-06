<p align="center">
  <img src="assets/logo.webp" alt="Flexify" width="220">
</p>

<h1 align="center">Flexify</h1>

<p align="center">
  <b>Created by <a href="https://github.com/HassanIrfan279">Hassan Irfan</a></b>
</p>

<p align="center">
  A smarter FLEX student portal for FAST-NUCES students.<br>
  GPA with repeats · Warning planner · Prerequisites · Absences · Two-click course feedback
</p>

<p align="center">
  <a href="../../releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/HassanIrfan279/Flexifybyhassan?label=download&color=00c2f7&style=for-the-badge"></a>
  <img alt="Chrome and Edge" src="https://img.shields.io/badge/Chrome%20%7C%20Edge-supported-0039be?style=for-the-badge">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/HassanIrfan279/Flexifybyhassan?color=1f2a44&style=for-the-badge"></a>
</p>

<!-- Drag your demo video here in GitHub's editor -->

---

## Quick start

### 1. Download

Go to **[Releases](../../releases/latest)** and download **`flexify-vX.X.X.zip`**.

> Don't use the green **Code → Download ZIP** button. That is the source code, not the extension.

### 2. Install (about 1 minute)

1. Right-click the zip → **Extract All** → **Extract**.
2. Open **`chrome://extensions`** (in Edge: `edge://extensions`).
3. Turn on **Developer mode** (top-right switch).
4. Click **Load unpacked** and select the extracted folder, the one that contains `manifest.json`.
5. Click the puzzle icon in the toolbar and **pin Flexify**.

### 3. Use it

1. Log in to **[Flex](https://flexstudent.nu.edu.pk)** as usual.
2. Open **Home**, **Transcript**, **Marks**, **Attendance** and **Tentative Study Plan** once each. Flexify reads each page as you open it.
3. Click the **Flexify** icon in your toolbar to see everything in one place.

That's it. Flexify also adds its tools directly onto Flex pages, such as the GPA calculator on your Transcript.

---

## Features

### GPA calculator, inside Flex
- Pick what-if grades on your **Transcript** page and watch your SGPA and CGPA update instantly.
- **Repeats are counted the way FAST counts them:** the latest attempt replaces the earlier grade. Withdrawals (W) and S/U courses are left out.
- Plan future repeats of low grades and see how much each one lifts your CGPA.

### Warning planner
- Your academic warning count and semester-by-semester history at a glance.
- The **minimum SGPA** you need to bring your CGPA back to 2.00.
- The **easiest grade combinations** that clear the warning. Lock the grades you already expect, and Flexify works out the rest.

### Prerequisites
- Every course in your roadmap checked against its prerequisites: **can take now**, **after this term**, or **blocked**.
- See which courses each course unlocks.

### Degree plan
- Your **fastest path to graduation**, semester by semester, respecting prerequisites and course limits.
- Compared with your batch's on-time graduation, with or without summer semesters.
- Degree progress, elective slots and a fee estimate for each semester.

### Marks
- Fills in the **Grand Total** that Flex leaves blank.
- Shows where you stand against the class average.
- Tells you what you need in the remaining assessments to reach your target.
- Flags marks that haven't been uploaded yet.

### Absences
- The number of absences in each course.
- A ready-to-send email to your teacher when an absence is wrong.

### Course feedback in two clicks
- Choose a rating, press **Fill & submit all**, then **Confirm**. Flexify completes every pending course's form for you.

### Teacher queries
- A ✉ button next to every mark and absence on Flex drafts a polite email with your course, section and roll number.
- Copy it, or open it prefilled in Gmail. You review it and press Send yourself.

### Also included
- Your photo, name and roll number on the home screen.
- Admit card download.
- **Dark mode for Flex**, with an animated background.
- One switch to turn Flexify off completely.

---

## Privacy

Flexify reads a Flex page **only when you open it**. Everything stays **on your own device**:

- no servers
- no tracking
- no analytics

It never logs in for you and never browses Flex on its own. Full details: [PRIVACY.md](PRIVACY.md).

---

## Updating

1. Download the latest zip from [Releases](../../releases/latest).
2. Replace the old folder with the new one, in the same location.
3. Go to `chrome://extensions` and click the **reload ↻** icon on Flexify.

## Troubleshooting

| Problem | Fix |
|---|---|
| **"Manifest file is missing or unreadable"** | You selected the wrong folder, or downloaded the source code. Download from **Releases** and select the folder that contains `manifest.json`. |
| **The popup says "Open … on Flex once"** | Open that page on Flex while logged in, then click the Flexify icon again. |
| **Flexify disappeared** | The folder was moved or deleted. Chrome loads it from that location, so keep the folder where it is. |
| **"Disable developer mode extensions" pop-up** | Click the X. This is normal for extensions installed manually. |

Found a bug or have an idea? Open an **[issue](../../issues)**.

---

## For developers

Built with WXT, Svelte 5 and TypeScript.

```bash
npm install
npm run dev        # Chrome with hot reload
npm test           # unit tests
npm run e2e        # end-to-end test of the built extension
npm run zip        # build the Chrome package
```

Pushing a version tag (for example `v1.0.1`) builds and publishes a new release automatically.

---

<p align="center">
  <b>Flexify</b> · Created by <a href="https://github.com/HassanIrfan279">Hassan Irfan</a> · <a href="LICENSE">MIT License</a><br>
  <sub>Independent project. Not affiliated with or endorsed by FAST-NUCES.</sub>
</p>
