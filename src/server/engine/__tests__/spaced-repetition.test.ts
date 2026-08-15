import { describe, expect, it } from "vitest";
import {
  applySpacedRepetition,
  createInitialSpacedRepetition,
} from "../spaced-repetition";

describe("spaced repetition", () => {
  const now = new Date("2026-08-15T10:00:00.000Z");

  it("uses T+1 after first successful review", () => {
    const initial = createInitialSpacedRepetition("item", now);
    const next = applySpacedRepetition(initial, true, now);

    expect(next.intervalDays).toBe(1);
    expect(next.nextReviewAt.toISOString()).toBe("2026-08-16T10:00:00.000Z");
  });

  it("uses T+3 and T+7 on later successful reviews", () => {
    let state = createInitialSpacedRepetition("item", now);
    state = applySpacedRepetition(state, true, now);
    state = applySpacedRepetition(state, true, now);
    expect(state.intervalDays).toBe(3);

    state = applySpacedRepetition(state, true, now);
    expect(state.intervalDays).toBe(7);
  });

  it("resets to T+1 after an error", () => {
    let state = createInitialSpacedRepetition("item", now);
    state = applySpacedRepetition(state, true, now);
    state = applySpacedRepetition(state, true, now);
    state = applySpacedRepetition(state, true, now);
    state = applySpacedRepetition(state, false, now);

    expect(state.intervalDays).toBe(1);
    expect(state.repetitions).toBe(0);
  });
});
