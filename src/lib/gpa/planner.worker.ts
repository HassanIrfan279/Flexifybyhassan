/// <reference lib="webworker" />
import type { Term, TranscriptSemester } from '../flex/transcript';
import type { GpaRules } from './engine';
import { planWarningRemoval, type PlannerCourse, type WarningRules } from './warnings';

export interface PlannerRequest {
  id: number;
  semesters: TranscriptSemester[];
  term: Term;
  courses: PlannerCourse[];
  rules: WarningRules;
  gpaRules: GpaRules;
}

/** Runs the warning planner off the UI thread; the exhaustive search can take ~1s. */
self.onmessage = (e: MessageEvent<PlannerRequest>) => {
  const { id, semesters, term, courses, rules, gpaRules } = e.data;
  const plan = planWarningRemoval(semesters, term, courses, rules, gpaRules);
  self.postMessage({ id, plan });
};
