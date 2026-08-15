import { describe, expect, it } from "vitest";
import { applyAttempt, recomputeTopicMastery } from "../mastery";

describe("mastery", () => {
  it("starts at zero", () => {
    const state = recomputeTopicMastery([], "topic-1");
    expect(state.mastery).toBe(0);
    expect(state.isMastered).toBe(false);
  });

  it("updates from attempts deterministically", () => {
    let state = recomputeTopicMastery([], "topic-1");
    state = applyAttempt(state, {
      studyItemId: "item-1",
      topicIds: ["topic-1"],
      isCorrect: true,
    });
    state = applyAttempt(state, {
      studyItemId: "item-2",
      topicIds: ["topic-1"],
      isCorrect: false,
    });

    expect(state.mastery).toBe(50);
    expect(state.successfulAttempts).toBe(1);
    expect(state.failedAttempts).toBe(1);
  });

  it("requires three successful attempts plus 85% mastery", () => {
    const results = [
      { studyItemId: "1", topicIds: ["t"], isCorrect: true },
      { studyItemId: "2", topicIds: ["t"], isCorrect: true },
      { studyItemId: "3", topicIds: ["t"], isCorrect: true },
    ];

    const state = recomputeTopicMastery(results, "t");
    expect(state.mastery).toBe(100);
    expect(state.successfulAttempts).toBe(3);
    expect(state.isMastered).toBe(true);
  });
});
