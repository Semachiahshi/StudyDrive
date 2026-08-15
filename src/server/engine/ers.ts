import type { ProjectReadinessInput } from "./types";

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function calculateERS(input: ProjectReadinessInput): number {
  const coverage = clampPercent(input.topicCoveragePercent);
  const mastery = clampPercent(input.averageMasteryPercent);
  const recentAccuracy = clampPercent(input.recentAccuracyPercent);

  return Math.round((coverage + mastery + recentAccuracy) / 3);
}
