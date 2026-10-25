import { addDays, daysBetween, type IsoDate } from "./dates";
import type { Progress } from "./progress";

/**
 * Pace model (shown to the user on the dashboard and in Settings):
 *
 * - Target: every step of a track is done `bufferDays` (default 14) before the
 *   first day of its exam date or window.
 * - Even plan: from the preparation start to the target, steps are spread
 *   evenly. "Expected" is how many steps that even plan would have done by today.
 * - Status: on track when less than one step behind the even plan, at risk when
 *   at most one week of plan behind, behind otherwise (or when the target has
 *   passed with work left).
 * - Needed pace: remaining steps ÷ remaining study days (the share of days set
 *   by `studyDaysPerWeek`).
 */

export type PaceSettings = {
  bufferDays: number;
  studyDaysPerWeek: number;
  /** Start of preparation. Null: the day the first topic of the track was added. */
  planStartedOn: IsoDate | null;
};

export const DEFAULT_PACE_SETTINGS: PaceSettings = {
  bufferDays: 14,
  studyDaysPerWeek: 7,
  planStartedOn: null,
};

export type PaceState =
  | "no_topics"
  | "no_date"
  | "done"
  | "exam_passed"
  | "on_track"
  | "at_risk"
  | "behind";

export type EstimateReason = "provisional_date" | "date_window";

export type TrackPaceInput = {
  progress: Progress;
  examStartsOn: IsoDate | null;
  examEndsOn: IsoDate | null;
  dateStatus: "provisional" | "confirmed";
  firstTopicAddedOn: IsoDate | null;
};

export type Pace = {
  state: PaceState;
  /** True when the date is provisional or only a window is known. */
  isEstimate: boolean;
  estimateReasons: EstimateReason[];
  targetDate: IsoDate | null;
  daysToTarget: number | null;
  daysToExam: number | null;
  remainingSteps: number;
  planStart: IsoDate | null;
  expectedDoneSteps: number | null;
  /** Steps behind the even plan (positive = behind). */
  deficitSteps: number | null;
  /** Steps per study day needed from today to finish in time. */
  perStudyDay: number | null;
  /** Steps per calendar week needed from today to finish in time. */
  perWeek: number | null;
};

export const PACE_LABEL: Record<PaceState, string> = {
  no_topics: "Chybí témata",
  no_date: "Chybí datum",
  done: "Hotovo",
  exam_passed: "Po zkoušce",
  on_track: "V plánu",
  at_risk: "Hrozí skluz",
  behind: "Ve skluzu",
};

const SEVERITY: Record<PaceState, number> = {
  behind: 5,
  at_risk: 4,
  on_track: 3,
  no_date: 2,
  no_topics: 2,
  done: 1,
  exam_passed: 0,
};

export function severity(state: PaceState): number {
  return SEVERITY[state];
}

export function isMeasured(state: PaceState): boolean {
  return state === "on_track" || state === "at_risk" || state === "behind";
}

export function computeTrackPace(
  input: TrackPaceInput,
  today: IsoDate,
  settings: PaceSettings = DEFAULT_PACE_SETTINGS,
): Pace {
  const { progress, examStartsOn, examEndsOn, dateStatus } = input;

  const estimateReasons: EstimateReason[] = [];
  if (examStartsOn && dateStatus === "provisional") estimateReasons.push("provisional_date");
  if (examStartsOn && examEndsOn && examEndsOn !== examStartsOn) estimateReasons.push("date_window");

  const base: Pace = {
    state: "no_topics",
    isEstimate: estimateReasons.length > 0,
    estimateReasons,
    targetDate: null,
    daysToTarget: null,
    daysToExam: null,
    remainingSteps: progress.remainingSteps,
    planStart: null,
    expectedDoneSteps: null,
    deficitSteps: null,
    perStudyDay: null,
    perWeek: null,
  };

  if (examStartsOn) {
    base.targetDate = addDays(examStartsOn, -settings.bufferDays);
    base.daysToTarget = daysBetween(today, base.targetDate);
    base.daysToExam = daysBetween(today, examStartsOn);
  }

  if (progress.topics === 0) return { ...base, state: "no_topics" };
  if (!examStartsOn || base.targetDate === null || base.daysToTarget === null || base.daysToExam === null) {
    return { ...base, state: progress.remainingSteps === 0 ? "done" : "no_date" };
  }
  if (daysBetween(examEndsOn ?? examStartsOn, today) > 0) return { ...base, state: "exam_passed" };
  if (progress.remainingSteps === 0) return { ...base, state: "done" };

  const remaining = progress.remainingSteps;
  const studyShare = Math.min(Math.max(settings.studyDaysPerWeek, 1), 7) / 7;

  // Days still available: until the target, or — if the target has already
  // passed — until the exam itself (at least today).
  const targetPassed = base.daysToTarget <= 0;
  const daysAvailable = Math.max(targetPassed ? base.daysToExam : base.daysToTarget, 1);
  const perStudyDay = remaining / Math.max(daysAvailable * studyShare, 1);
  const perWeek = Math.min(remaining, (remaining * 7) / daysAvailable);

  let planStart = settings.planStartedOn ?? input.firstTopicAddedOn ?? today;
  if (planStart > today) planStart = today;
  const span = daysBetween(planStart, base.targetDate);
  const elapsed = daysBetween(planStart, today);
  const expected = span <= 0 ? progress.totalSteps : progress.totalSteps * Math.min(Math.max(elapsed / span, 0), 1);
  const deficit = expected - progress.doneSteps;
  const weekOfPlan = span <= 0 ? 0 : Math.max((progress.totalSteps * 7) / span, 1);

  let state: PaceState;
  if (targetPassed) state = "behind";
  else if (deficit < 1) state = "on_track";
  else if (deficit <= weekOfPlan) state = "at_risk";
  else state = "behind";

  return {
    ...base,
    state,
    planStart,
    expectedDoneSteps: expected,
    deficitSteps: deficit,
    perStudyDay,
    perWeek,
  };
}

/** Steps per day/week rounded up for display ("aspoň 2 kroky denně"). */
export function roundUpPace(value: number | null): number | null {
  if (value === null) return null;
  if (value <= 0) return 0;
  return value < 1 ? Math.round(value * 10) / 10 : Math.ceil(value);
}
