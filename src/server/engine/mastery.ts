import type {
  StudyItemResult,
  TopicKnowledgeState,
} from "./types";

export type Attempt = {
  correct: boolean;
};

export function calculateMastery(attempts: Attempt[]): number {
  if (attempts.length === 0) {
    return 0;
  }

  const successfulAttempts = attempts.filter(
    (attempt) => attempt.correct,
  ).length;

  return Math.round(
    (successfulAttempts / attempts.length) * 10000,
  ) / 100;
}

export function isMastered(
  mastery: number,
  successfulAttempts: number,
): boolean {
  return mastery >= 85 && successfulAttempts >= 3;
}

export function recomputeTopicMastery(
  results: StudyItemResult[],
  topicId: string,
): TopicKnowledgeState {
  const topicResults = results.filter(
    (result) =>
      result.topicIds.includes(topicId) &&
      result.invalidated !== true,
  );

  const successfulAttempts = topicResults.filter(
    (result) => result.isCorrect,
  ).length;

  const failedAttempts = topicResults.filter(
    (result) => !result.isCorrect,
  ).length;

  const mastery = calculateMastery(
    topicResults.map((result) => ({
      correct: result.isCorrect,
    })),
  );

  return {
    topicId,
    mastery,
    successfulAttempts,
    failedAttempts,
    isMastered: isMastered(mastery, successfulAttempts),
  };
}

export function applyAttempt(
  state: TopicKnowledgeState,
  result: StudyItemResult,
): TopicKnowledgeState {
  if (result.invalidated === true) {
    return state;
  }

  const successfulAttempts =
    state.successfulAttempts + (result.isCorrect ? 1 : 0);

  const failedAttempts =
    state.failedAttempts + (result.isCorrect ? 0 : 1);

  const totalAttempts = successfulAttempts + failedAttempts;

  const mastery =
    totalAttempts === 0
      ? 0
      : Math.round(
          (successfulAttempts / totalAttempts) * 10000,
        ) / 100;

  return {
    topicId: state.topicId,
    mastery,
    successfulAttempts,
    failedAttempts,
    isMastered: isMastered(mastery, successfulAttempts),
  };
}
