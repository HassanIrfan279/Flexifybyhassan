# Flex page fixtures

Pages from flexstudent.nu.edu.pk in Flex's real HTML layout, filled with a **fictional student**, used to build and test Flexify's parsers offline.

- The page structure (tables, classes, headings) is Flex's own, so parsers are tested against what they will meet on Flex.
- Every personal value is invented: grades, sections, campus, marks, class statistics and attendance. Names, roll numbers and other identifiers are placeholders.
- The transcript's printed totals (Cr. Att, Cr. Ernd, CGPA, SGPA) were computed by a separate implementation of FAST's rules, so `engine.test.ts` checks Flexify's GPA engine against an independent calculation.

| File | Page | Notes |
|---|---|---|
| home.html | `/` | Degree, campus, batch, academic calendar |
| transcript.html | `/Student/Transcript` | F grades, repeats (`R-1`), withdrawals (including a W on a repeat), non-credit S/U, a CGPA warning history |
| studyplan.html | `/Student/TentativeStudyPlan` | BS(CS) roadmap (public curriculum) |
| marks.html | `/Student/StudentMarks` | Includes marks not yet uploaded (`-`) |
| attendance.html | `/Student/StudentAttendance` | One course where Flex's percentage lags the lecture list |
| feedback-list.html | `/Student/CourseFeedback` | Feedback window closed, all submitted |
