import type {
  DailyTask,
  PlanningInput,
  ProjectState,
  RiskState,
} from "./types";

export function calculateRequiredPace(
  input: PlanningInput,
): number {
  if (
    input.remainingStudyMinutes <= 0 ||
    input.remainingDays <= 0
  ) {
    return 0;
  }

  return Math.ceil(
    input.remainingStudyMinutes / input.remainingDays,
  );
}

export function calculateDeadlineRisk(
  input: PlanningInput,
): RiskState {
  if (
    input.remainingStudyMinutes <= 0 ||
    input.remainingDays <= 0 ||
    input.dailyCapacityMinutes <= 0
  ) {
    return "insufficient_data";
  }

  const requiredPace = calculateRequiredPace(input);

  return requiredPace <= input.dailyCapacityMinutes
    ? "on_track"
    : "at_risk";
}

export function calculateProjectState(
  input: PlanningInput & { ers: number },
): ProjectState {
  return {
    ers: input.ers,
    requiredPaceMinutes: calculateRequiredPace(input),
    deadlineRisk: calculateDeadlineRisk(input),
  };
}

export function buildDailyPlan(
  tasks: DailyTask[],
  capacityMinutes: number,
): DailyTask[] {
  if (capacityMinutes <= 0) {
    return [];
  }

  return [...tasks]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .reduce<DailyTask[]>((plan, task) => {
      const usedMinutes = plan.reduce(
        (sum, item) => sum + item.estimatedMinutes,
        0,
      );

      if (
        usedMinutes + task.estimatedMinutes <=
        capacityMinutes
      ) {
        plan.push(task);
      }

      return plan;
    }, []);
}
