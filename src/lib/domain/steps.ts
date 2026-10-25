export const STEPS = ["learn", "practice", "review"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABEL: Record<Step, string> = {
  learn: "Naučit",
  practice: "Procvičit",
  review: "Zopakovat",
};

export const STEP_NOUN: Record<Step, string> = {
  learn: "Učení",
  practice: "Procvičení",
  review: "Opakování",
};

export type StepState = {
  learn_completed_at: string | null;
  practice_completed_at: string | null;
  review_completed_at: string | null;
};

export function isStepDone(topic: StepState, step: Step): boolean {
  return topic[`${step}_completed_at`] !== null;
}

export function completedStepCount(topic: StepState): number {
  return STEPS.filter((s) => isStepDone(topic, s)).length;
}

/** The first step that is not done yet, or null when the topic is complete. */
export function nextStep(topic: StepState): Step | null {
  return STEPS.find((s) => !isStepDone(topic, s)) ?? null;
}

/** Steps follow Learn → Practice → Review: a step can be completed once the previous one is. */
export function canComplete(topic: StepState, step: Step): boolean {
  const i = STEPS.indexOf(step);
  return !isStepDone(topic, step) && (i === 0 || isStepDone(topic, STEPS[i - 1]));
}

/** Only the latest completed step can be reopened, so the order stays intact. */
export function canReopen(topic: StepState, step: Step): boolean {
  const i = STEPS.indexOf(step);
  return isStepDone(topic, step) && (i === STEPS.length - 1 || !isStepDone(topic, STEPS[i + 1]));
}
