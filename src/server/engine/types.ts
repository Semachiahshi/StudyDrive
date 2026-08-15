export type RiskState =
  | "insufficient_data"
  | "on_track"
  | "at_risk";

export interface TopicKnowledgeState {
  topicId: string;
  mastery: number;
  successfulAttempts: number;
  failedAttempts: number;
  isMastered: boolean;
}

export interface StudyItemResult {
  studyItemId: string;
  topicIds: string[];
  isCorrect: boolean;
  invalidated?: boolean;
}

export interface SpacedRepetitionState {
  studyItemId: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: Date;
}

export interface ProjectReadinessInput {
  topicCoveragePercent: number;
  averageMasteryPercent: number;
  recentAccuracyPercent: number;
}

export interface ProjectState {
  ers: number;
  deadlineRisk: RiskState;
  requiredPaceMinutes: number;
}

export interface PlanningInput {
  remainingStudyMinutes: number;
  remainingDays: number;
  dailyCapacityMinutes: number;
}

export interface DailyTask {
  studyItemId: string;
  priority: number;
  estimatedMinutes: number;
  reason:
    | "diagnostic"
    | "deadline_risk"
    | "mastery_gap"
    | "spaced_review"
    | "critical_error";
}
