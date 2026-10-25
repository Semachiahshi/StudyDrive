import type { IsoDate } from "./dates";
import { severity, type PaceState } from "./pace";
import { nextStep, type Step, type StepState } from "./steps";

export type SuggestionTrack = {
  id: string;
  state: PaceState;
  targetDate: IsoDate | null;
  topics: readonly (StepState & { id: string; title: string; position: number })[];
};

export type Suggestion = {
  trackId: string;
  topicId: string;
  topicTitle: string;
  step: Step;
  reason: "behind" | "at_risk" | "nearest" | "continue";
};

/**
 * A non-binding suggestion for what to study next: the first open step in the
 * track that needs it most (behind → at risk → nearest target). Topics are
 * taken in their configured order, so a half-finished topic is continued
 * before a new one is started.
 */
export function suggestNext(tracks: readonly SuggestionTrack[]): Suggestion | null {
  const candidates = tracks
    .filter((t) => t.state !== "done" && t.state !== "exam_passed" && t.topics.some((topic) => nextStep(topic)))
    .sort((a, b) => {
      const bySeverity = severity(b.state) - severity(a.state);
      if (bySeverity !== 0) return bySeverity;
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;
      return 0;
    });

  const track = candidates[0];
  if (!track) return null;

  const ordered = [...track.topics].sort((a, b) => a.position - b.position);
  const started = ordered.find((t) => nextStep(t) && nextStep(t) !== "learn");
  const topic = started ?? ordered.find((t) => nextStep(t));
  if (!topic) return null;

  const step = nextStep(topic)!;
  const reason =
    track.state === "behind" ? "behind" : track.state === "at_risk" ? "at_risk" : track.targetDate ? "nearest" : "continue";

  return { trackId: track.id, topicId: topic.id, topicTitle: topic.title, step, reason };
}
