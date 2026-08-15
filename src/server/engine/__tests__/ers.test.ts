import { describe, expect, it } from "vitest";
import { calculateERS } from "../ers";

describe("ERS", () => {
  it("uses equal-weight coverage, mastery and recent accuracy", () => {
    expect(
      calculateERS({
        topicCoveragePercent: 100,
        averageMasteryPercent: 80,
        recentAccuracyPercent: 60,
      }),
    ).toBe(80);
  });

  it("clamps invalid component values", () => {
    expect(
      calculateERS({
        topicCoveragePercent: 150,
        averageMasteryPercent: -10,
        recentAccuracyPercent: 50,
      }),
    ).toBe(50);
  });
});
