import type { SpacedRepetitionState } from "./types";

const INITIAL_EASE_FACTOR = 2.5;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function createInitialSpacedRepetition(
  studyItemId: string,
  now: Date,
): SpacedRepetitionState {
  return {
    studyItemId,
    intervalDays: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    repetitions: 0,
    nextReviewAt: now,
  };
}

export function nextIntervalDays(
  repetitions: number,
  correct: boolean,
  previousInterval: number,
): number {
  if (!correct) {
    return 1;
  }

  if (repetitions <= 0) {
    return 1;
  }

  if (repetitions === 1) {
    return 3;
  }

  if (repetitions === 2) {
    return 7;
  }

  if (repetitions === 3) {
    return 14;
  }

  return Math.max(
    1,
    Math.round(previousInterval * 2),
  );
}

export function applySpacedRepetition(
  state: SpacedRepetitionState,
  correct: boolean,
  now: Date,
): SpacedRepetitionState {
  if (!correct) {
    return {
      ...state,
      intervalDays: 1,
      repetitions: 0,
      nextReviewAt: addDays(now, 1),
    };
  }

  const intervalDays = nextIntervalDays(
    state.repetitions,
    true,
    state.intervalDays,
  );

  return {
    ...state,
    intervalDays,
    repetitions: state.repetitions + 1,
    nextReviewAt: addDays(now, intervalDays),
  };
}
