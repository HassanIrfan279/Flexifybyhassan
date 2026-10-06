import { cleanText, parseCourseHeading, toNumber, toNumberOrNull } from './table';

export interface Assessment {
  number: number;
  /** Share of the course's 100 marks this item is worth. */
  weight: number;
  /** null = not uploaded yet ('-' on Flex). */
  obtained: number | null;
  total: number;
  average: number | null;
  min: number | null;
  max: number | null;
}

export interface MarksCategory {
  /** e.g. "Quiz", "Assignment", "Sessional-I", "Lab Work". */
  name: string;
  /** Category weight as Flex totals it (already accounts for best-of). */
  weight: number;
  /** Weighted marks obtained, as Flex totals it. */
  obtained: number;
  items: Assessment[];
}

export interface CourseMarks {
  code: string;
  name: string;
  section: string;
  categories: MarksCategory[];
}

/**
 * Parses /Student/StudentMarks. Each course is a `.tab-pane` with an <h5>
 * heading and one card per category; each category table has
 * `tr.calculationrow` items and a `tr.totalColumn_*` total row.
 */
export function parseMarks(doc: Document): CourseMarks[] {
  const courses: CourseMarks[] = [];

  for (const pane of Array.from(doc.querySelectorAll('.tab-pane'))) {
    const heading = parseCourseHeading(pane.querySelector('h5')?.textContent ?? '');
    if (!heading) continue;

    const categories: MarksCategory[] = [];
    for (const table of Array.from(pane.querySelectorAll('table'))) {
      const items = Array.from(table.querySelectorAll('tr.calculationrow')).map(
        (row, i): Assessment => ({
          number: toNumberOrNull(cell(row, 'td:first-child')) ?? i + 1,
          weight: toNumber(cell(row, '.weightage')),
          obtained: toNumberOrNull(cell(row, '.ObtMarks')),
          total: toNumber(cell(row, '.GrandTotal')),
          average: toNumberOrNull(cell(row, '.AverageMarks')),
          min: toNumberOrNull(cell(row, '.MinMarks')),
          max: toNumberOrNull(cell(row, '.MaxMarks')),
        }),
      );
      const totalRow = table.querySelector('tr[class^="totalColumn_"], tr[class*=" totalColumn_"]');
      if (!items.length || !totalRow) continue;

      const card = table.closest('.card');
      const name = cleanText(card?.querySelector('.card-header')?.textContent) || 'Assessment';
      categories.push({
        name,
        weight: toNumber(cell(totalRow, '.totalColweightage')),
        obtained: toNumber(cell(totalRow, '.totalColObtMarks')),
        items,
      });
    }

    courses.push({ ...heading, categories });
  }

  return courses;
}

function cell(row: Element, selector: string): string {
  return cleanText(row.querySelector(selector)?.textContent);
}

export interface CourseMarksSummary {
  /** Weight of all categories so far (out of 100). */
  weightSoFar: number;
  obtained: number;
  /** Estimated from per-item class statistics; Flex only publishes these per item. */
  classAverage: number | null;
  classMin: number | null;
  classMax: number | null;
  /** Weight of assessments whose marks are uploaded; comparisons use only these. */
  gradedWeight: number;
  /** obtained / gradedWeight as a percentage. */
  percentage: number;
  /** Items whose marks are not uploaded yet. */
  pending: { category: string; item: Assessment }[];
}

/**
 * Builds the grand total Flex leaves empty. Obtained marks come straight from
 * Flex's category totals (which already apply best-of rules). Class
 * statistics are estimates: each item's average is scaled by its weight, then
 * by category weight / item weights to account for best-of.
 */
export function summarizeCourse(course: CourseMarks): CourseMarksSummary {
  let weightSoFar = 0;
  let gradedWeight = 0;
  let obtained = 0;
  const stats = { average: 0, min: 0, max: 0 };
  let statsComplete = true;
  const pending: CourseMarksSummary['pending'] = [];

  for (const cat of course.categories) {
    weightSoFar += cat.weight;
    obtained += cat.obtained;

    const itemWeights = cat.items.reduce((s, it) => s + it.weight, 0);
    const scale = itemWeights > 0 ? cat.weight / itemWeights : 0;
    for (const item of cat.items) {
      // Class statistics only for items the student has marks for, so a
      // not-uploaded mark never reads as "below the class".
      if (item.obtained === null) {
        pending.push({ category: cat.name, item });
        continue;
      }
      gradedWeight += item.weight * scale;
      for (const key of ['average', 'min', 'max'] as const) {
        const value = item[key];
        if (value === null || !item.total) statsComplete = false;
        else stats[key] += (value / item.total) * item.weight * scale;
      }
    }
  }

  const hasStats = statsComplete && gradedWeight > 0;
  return {
    weightSoFar,
    gradedWeight,
    obtained,
    classAverage: hasStats ? stats.average : null,
    classMin: hasStats ? stats.min : null,
    classMax: hasStats ? stats.max : null,
    percentage: gradedWeight ? (obtained / gradedWeight) * 100 : 0,
    pending,
  };
}

/**
 * Marks needed in the remaining weight to finish the course on `targetTotal`
 * (out of 100). `percentNeeded` > 100 means the target is out of reach.
 */
export function neededForTarget(summary: CourseMarksSummary, targetTotal: number) {
  const remainingWeight = Math.max(0, 100 - summary.weightSoFar);
  const marksNeeded = Math.max(0, targetTotal - summary.obtained);
  return {
    remainingWeight,
    marksNeeded,
    percentNeeded: remainingWeight ? (marksNeeded / remainingWeight) * 100 : marksNeeded > 0 ? Infinity : 0,
    reachable: marksNeeded <= remainingWeight,
  };
}
