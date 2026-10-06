# Store listing — Flexify

Copy-paste text for the Chrome Web Store and Firefox Add-ons (AMO).

## Name
Flexify

## Short description (≤132 characters)
Flexify by Hassan Irfan: GPA with repeats, warning planner, prerequisites, absences and two-click course feedback for FAST Flex.

## Category
Chrome: **Education** · Firefox: **Education & Learning** (or Other)

## Detailed description

Flexify makes FAST-NUCES's FlexStudent portal faster, clearer and better looking. Made by Hassan Irfan. Everything stays on your device.

**GPA calculator, right inside Flex**
• Pick what-if grades on your Transcript page and watch your SGPA and CGPA update
• Repeats replace your earlier grade the way FAST counts them; withdrawals leave it in place
• Plan future repeats of low grades and see how much each one lifts your CGPA

**Warning planner**
• Your warning history and current count at a glance
• The minimum SGPA that brings CGPA back to 2.00, and the easiest grade combinations to get there

**Prerequisites**
• Every course in your roadmap checked against its prerequisites: can take now, after this term, or blocked
• See what each course unlocks

**Degree timeline**
• The fastest prerequisite-aware path to graduation at your course limits, with or without summers
• Compared with your batch's on-time date, with a fee estimate per semester

**Course feedback in two clicks**
• Choose a rating, press Fill & submit all, confirm — Flexify completes every pending course's form in your Flex tab

**Marks and absences**
• The grand total Flex leaves blank, your standing against the class, and what you need in the final
• Absences per course, with a ready email to your teacher when one is wrong

**Also**
• Your photo, name and roll number on the Home tab
• Admit card download
• A premium dark mode for Flex with an animated particle background
• One switch to turn Flexify off completely

**Privacy first**
Flexify reads a Flex page only when you open it, never logs in for you, never browses Flex on its own, and sends nothing to any server. No analytics, no tracking, no ads.

Flexify is an independent project and is not affiliated with FAST-NUCES.

## Single purpose (Chrome)
Flexify enhances the FAST-NUCES FlexStudent portal with academic tools (GPA and warning planning, prerequisites, marks, absences and course-feedback filling) for the student using it.

## Permission justifications (Chrome)

| Permission | Justification |
|---|---|
| `storage` | Saves the academic data read from Flex pages the student opens, and their settings, on their own device so the popup can show it. |
| Host `https://flexstudent.nu.edu.pk/*` | Reads the Flex page the student is viewing, adds Flexify's tools to it (GPA calculator, grand totals, query buttons, dark mode), and fills the course-feedback forms when the student asks. No other site is accessed. |

**Remote code:** No. All code is bundled in the extension.

## Data usage disclosures (Chrome "Privacy practices")
Data handled on device only: **Personally identifiable information** (name, roll number, profile photo) and **Educational information / student records** (grades, marks, attendance).

Certify all three:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** the public URL where `PRIVACY.md` is published.

## Firefox (AMO) notes
- Data collection: declared as **none** (`data_collection_permissions: { required: ["none"] }`); data stays on the device.
- Upload `flexify-<version>-firefox.zip`; when asked for source code, upload `flexify-<version>-sources.zip`.
- Reviewer notes: "Built with WXT + Svelte. To build: `npm ci && npm run zip:firefox`. Output is in `.output/`. The two `innerHTML` lint warnings come from Svelte's runtime template cloning, not from dynamic content."

## Assets (this folder)
| File | Use |
|---|---|
| `1-warning.png` … `5-marks.png` | Screenshots, 1280×800 (both stores) |
| `promo-small-440x280.png` | Chrome small promo tile (required) |
| `promo-marquee-1400x560.png` | Chrome marquee promo tile (optional) |
| `../public/icon/128.png` | Store icon, 128×128 |

Screenshots use a fictional demo student (`npm run preview:ui`, then `node scripts/screenshots.mjs`).
