// Re-rolls the fixture student's numbers once more for
// public screenshots: grades are reshuffled, marks and attendance re-rolled.
import type { CourseAttendance } from '@/lib/flex/attendance';
import { GRADE_POINTS, isLetterGrade, type LetterGrade } from '@/lib/flex/grades';
import type { CourseMarks } from '@/lib/flex/marks';
import type { Transcript } from '@/lib/flex/transcript';

let seed = 20261006;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
};

// Target SGPA per semester, giving a typical "two warnings, cleared in summer, two again" story.
const TARGETS = [1.6, 1.9, 4.0, 1.75, 1.6];
const LEVELS = Object.entries(GRADE_POINTS).filter(([g]) => g !== 'A+') as [LetterGrade, number][];

function gradeNear(target: number): LetterGrade {
  const wanted = Math.max(0, Math.min(4, target + (rand() - 0.5) * 1.4));
  return LEVELS.reduce((best, cur) => (Math.abs(cur[1] - wanted) < Math.abs(best[1] - wanted) ? cur : best))[0];
}

export function demoTranscript(t: Transcript): Transcript {
  return {
    ...t,
    semesters: t.semesters.map((sem, i) => ({
      ...sem,
      flexStats: null,
      courses: sem.courses.map((c) => {
        if (!isLetterGrade(c.grade)) return c;
        const grade = gradeNear(TARGETS[i] ?? 2.2);
        return { ...c, grade, points: GRADE_POINTS[grade], section: c.section.replace(/\d[A-Z]\d?$/, '1A') };
      }),
    })),
  };
}

export function demoMarks(courses: CourseMarks[]): CourseMarks[] {
  return courses.map((course) => ({
    ...course,
    section: 'BCS-3A',
    categories: course.categories.map((cat) => {
      const items = cat.items.map((it) => ({
        ...it,
        obtained: it.obtained === null && rand() < 0.5 ? null : Math.round(it.total * (0.45 + rand() * 0.5) * 2) / 2,
      }));
      const obtained = items.reduce((s, it) => s + (it.obtained === null ? 0 : (it.obtained / it.total) * it.weight), 0);
      return { ...cat, items, obtained };
    }),
  }));
}

export function demoAttendance(courses: CourseAttendance[]): CourseAttendance[] {
  return courses.map((course, i) => ({
    ...course,
    section: 'BCS-3A',
    flexPercentage: null,
    lectures: course.lectures.map((l) => ({ ...l, present: rand() < [0.92, 0.8, 0.7, 0.88, 0.96][i % 5]! })),
  }));
}
