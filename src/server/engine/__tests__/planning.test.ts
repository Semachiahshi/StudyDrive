import { describe, expect, it } from "vitest";
import {
  buildDailyPlan,
  calculateDeadlineRisk,
  calculateProjectState,
  calculateRequiredPace,
} from "../planning";

describe("planning", () => {
  it("calculates required pace", () => {
    expect(
      calculateRequiredPace({
        remainingStudyMinutes: 300,
        remainingDays: 10,
        dailyCapacityMinutes: 45,
      }),
    ).toBe(30);
  });

  it("marks an impossible plan at risk", () => {
    expect(
      calculateDeadlineRisk({
        remainingStudyMinutes: 500,
        remainingDays: 10,
        dailyCapacityMinutes: 45,
      }),
    ).toBe("at_risk");
  });

  it("returns deterministic project state", () => {
    expect(
      calculateProjectState({
        remainingStudyMinutes: 300,
        remainingDays: 10,
        dailyCapacityMinutes: 45,
        ers: 42,
      }),
    ).toEqual({
      ers: 42,
      requiredPaceMinutes: 30,
      deadlineRisk: "on_track",
    });
  });

  it("limits Today's Plan to five tasks and capacity", () => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({
      studyItemId: `item-${i}`,
      priority: i,
      estimatedMinutes: 10,
      reason: "mastery_gap" as const,
    }));

    const plan = buildDailyPlan(tasks, 40);
    expect(plan).toHaveLength(4);
    expect(plan.reduce((sum, task) => sum + task.estimatedMinutes, 0)).toBe(40);
  });
});
