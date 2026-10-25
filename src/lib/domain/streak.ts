import { addDays, daysBetween, type IsoDate } from "./dates";

export type Streak = {
  /** Consecutive study days ending today, or yesterday if today has no activity yet. */
  current: number;
  best: number;
  studiedToday: boolean;
  lastStudyDay: IsoDate | null;
};

/**
 * Computes the streak from distinct local study days. A study day is any day
 * with an explicit "start studying" action or a completed step — opening the
 * app does not count. An unfinished today does not break the streak.
 */
export function computeStreak(studyDays: Iterable<IsoDate>, today: IsoDate): Streak {
  const days = [...new Set(studyDays)].filter((d) => d <= today).sort();
  if (days.length === 0) {
    return { current: 0, best: 0, studiedToday: false, lastStudyDay: null };
  }

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const set = new Set(days);
  const lastStudyDay = days[days.length - 1];
  const studiedToday = set.has(today);
  let cursor = studiedToday ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { current, best, studiedToday, lastStudyDay };
}
