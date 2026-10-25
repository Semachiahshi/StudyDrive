export type ProgressInput = { completed_steps: number };

export type Progress = {
  topics: number;
  completedTopics: number;
  totalSteps: number;
  doneSteps: number;
  remainingSteps: number;
  /** 0–1, or null when there is nothing to measure yet. */
  ratio: number | null;
};

export function summarize(topics: readonly ProgressInput[]): Progress {
  const totalSteps = topics.length * 3;
  const doneSteps = topics.reduce((sum, t) => sum + t.completed_steps, 0);
  return {
    topics: topics.length,
    completedTopics: topics.filter((t) => t.completed_steps === 3).length,
    totalSteps,
    doneSteps,
    remainingSteps: totalSteps - doneSteps,
    ratio: totalSteps === 0 ? null : doneSteps / totalSteps,
  };
}

export function combine(parts: readonly Progress[]): Progress {
  const total = parts.reduce(
    (acc, p) => ({
      topics: acc.topics + p.topics,
      completedTopics: acc.completedTopics + p.completedTopics,
      totalSteps: acc.totalSteps + p.totalSteps,
      doneSteps: acc.doneSteps + p.doneSteps,
    }),
    { topics: 0, completedTopics: 0, totalSteps: 0, doneSteps: 0 },
  );
  return {
    ...total,
    remainingSteps: total.totalSteps - total.doneSteps,
    ratio: total.totalSteps === 0 ? null : total.doneSteps / total.totalSteps,
  };
}

export function percent(ratio: number | null): string {
  return ratio === null ? "–" : `${Math.round(ratio * 100)} %`;
}
