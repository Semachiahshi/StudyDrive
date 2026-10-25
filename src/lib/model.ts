// Turns raw rows into the view model shared by the screens. Pure (no I/O), so
// the roll-ups and status logic are unit-testable.

import { daysBetween, localDate, type IsoDate } from "./domain/dates";
import { computeTrackPace, isMeasured, severity, type Pace, type PaceSettings, type PaceState } from "./domain/pace";
import { combine, summarize, type Progress } from "./domain/progress";
import { computeStreak, type Streak } from "./domain/streak";
import { suggestNext, type Suggestion } from "./domain/suggestion";

type SubjectLike = { id: string; name: string; code: string | null; archived_at: string | null; position: number };
type TrackLike = {
  id: string;
  subject_id: string;
  name: string;
  kind: string;
  archived_at: string | null;
  exam_starts_on: string | null;
  exam_ends_on: string | null;
  exam_date_status: "provisional" | "confirmed";
  position: number;
};
type TopicLike = {
  id: string;
  track_id: string;
  title: string;
  position: number;
  archived_at: string | null;
  created_at: string;
  completed_steps: number | null;
  learn_completed_at: string | null;
  practice_completed_at: string | null;
  review_completed_at: string | null;
};
type TaskLike = { id: string; title: string; due_on: string | null; completed_at: string | null; subject_id: string | null };

export const SUBJECT_COLORS = ["blue", "indigo", "teal", "orange", "pink", "green", "purple", "brown"] as const;
export const subjectColor = (index: number) => `var(--c-${SUBJECT_COLORS[index % SUBJECT_COLORS.length]})`;

export type TrackView<TTrack extends TrackLike, TTopic extends TopicLike> = {
  track: TTrack;
  topics: TTopic[];
  progress: Progress;
  pace: Pace;
};

export type SubjectView<TSubject extends SubjectLike, TTrack extends TrackLike, TTopic extends TopicLike> = {
  subject: TSubject;
  color: string;
  tracks: TrackView<TTrack, TTopic>[];
  progress: Progress;
  worstState: PaceState | null;
};

export type TimelineEvent = {
  id: string;
  kind: "exam" | "target" | "admin";
  date: IsoDate;
  endDate?: IsoDate | null;
  title: string;
  detail?: string;
  href: string;
  estimate?: boolean;
  done?: boolean;
};

export type OverallPace = {
  state: PaceState | "empty" | "incomplete";
  isEstimate: boolean;
  remainingSteps: number;
  perStudyDay: number | null;
  perWeek: number | null;
  nearestTarget: IsoDate | null;
  measuredTracks: number;
  behind: { trackId: string; title: string; pace: Pace }[];
  atRisk: { trackId: string; title: string; pace: Pace }[];
};

export type MissingInfo = {
  noSubjects: boolean;
  subjectsWithoutTracks: { id: string; name: string }[];
  tracksWithoutDate: { id: string; title: string }[];
  tracksWithoutTopics: { id: string; title: string }[];
};

export function trackTitle(subject: { name: string; code: string | null }, track: { name: string }) {
  return `${subject.code || subject.name} · ${track.name}`;
}

export function buildModel<
  TSubject extends SubjectLike,
  TTrack extends TrackLike,
  TTopic extends TopicLike,
  TTask extends TaskLike,
>(input: {
  today: IsoDate;
  timeZone?: string;
  settings: PaceSettings;
  subjects: TSubject[];
  tracks: TTrack[];
  topics: TTopic[];
  adminTasks: TTask[];
  studyDays: string[];
}) {
  const { today, settings } = input;
  const tz = input.timeZone ?? "Europe/Prague";

  const activeTopics = input.topics.filter((t) => !t.archived_at);
  const topicsByTrack = new Map<string, TTopic[]>();
  for (const topic of activeTopics) {
    const list = topicsByTrack.get(topic.track_id) ?? [];
    list.push(topic);
    topicsByTrack.set(topic.track_id, list);
  }

  const subjects: SubjectView<TSubject, TTrack, TTopic>[] = input.subjects
    .filter((s) => !s.archived_at)
    .map((subject, index) => {
      const tracks = input.tracks
        .filter((t) => t.subject_id === subject.id && !t.archived_at)
        .map((track) => {
          const topics = (topicsByTrack.get(track.id) ?? []).sort((a, b) => a.position - b.position);
          const progress = summarize(topics.map((t) => ({ completed_steps: t.completed_steps ?? 0 })));
          const firstAdded = topics.reduce<string | null>((min, t) => {
            const d = localDate(new Date(t.created_at), tz);
            return !min || d < min ? d : min;
          }, null);
          const pace = computeTrackPace(
            {
              progress,
              examStartsOn: track.exam_starts_on,
              examEndsOn: track.exam_ends_on,
              dateStatus: track.exam_date_status,
              firstTopicAddedOn: firstAdded,
            },
            today,
            settings,
          );
          return { track, topics, progress, pace };
        });
      const measured = tracks.filter((t) => t.pace.state !== "exam_passed");
      const worstState = measured.length
        ? measured.reduce((w, t) => (severity(t.pace.state) > severity(w) ? t.pace.state : w), measured[0].pace.state)
        : null;
      return { subject, color: subjectColor(index), tracks, progress: combine(tracks.map((t) => t.progress)), worstState };
    });

  const allTracks = subjects.flatMap((s) => s.tracks.map((t) => ({ ...t, subject: s.subject })));
  const progress = combine(subjects.map((s) => s.progress));
  const streak: Streak = computeStreak(input.studyDays, today);

  // ---- overall pace
  const measured = allTracks.filter((t) => isMeasured(t.pace.state));
  const named = (t: (typeof allTracks)[number]) => ({ trackId: t.track.id, title: trackTitle(t.subject, t.track), pace: t.pace });
  const sum = (values: (number | null)[]) =>
    values.some((v) => v !== null) ? values.reduce<number>((a, v) => a + (v ?? 0), 0) : null;
  let overallState: OverallPace["state"];
  if (allTracks.length === 0) overallState = "empty";
  else if (measured.length === 0) {
    const relevant = allTracks.filter((t) => t.pace.state !== "exam_passed");
    overallState = relevant.length > 0 && relevant.every((t) => t.pace.state === "done") ? "done" : "incomplete";
  } else {
    overallState = measured.reduce<PaceState>(
      (w, t) => (severity(t.pace.state) > severity(w) ? t.pace.state : w),
      measured[0].pace.state,
    );
  }
  const overall: OverallPace = {
    state: overallState,
    isEstimate: measured.some((t) => t.pace.isEstimate),
    remainingSteps: progress.remainingSteps,
    perStudyDay: sum(measured.map((t) => t.pace.perStudyDay)),
    perWeek: sum(measured.map((t) => t.pace.perWeek)),
    nearestTarget:
      measured
        .map((t) => t.pace.targetDate)
        .filter((d): d is string => !!d)
        .sort()[0] ?? null,
    measuredTracks: measured.length,
    behind: allTracks.filter((t) => t.pace.state === "behind").map(named),
    atRisk: allTracks.filter((t) => t.pace.state === "at_risk").map(named),
  };

  // ---- missing information
  const missing: MissingInfo = {
    noSubjects: subjects.length === 0,
    subjectsWithoutTracks: subjects.filter((s) => s.tracks.length === 0).map((s) => ({ id: s.subject.id, name: s.subject.name })),
    tracksWithoutDate: allTracks.filter((t) => !t.track.exam_starts_on).map((t) => ({ id: t.track.id, title: trackTitle(t.subject, t.track) })),
    tracksWithoutTopics: allTracks.filter((t) => t.topics.length === 0).map((t) => ({ id: t.track.id, title: trackTitle(t.subject, t.track) })),
  };

  // ---- timeline (route to maturita)
  const events: TimelineEvent[] = [];
  for (const t of allTracks) {
    if (!t.track.exam_starts_on) continue;
    const title = trackTitle(t.subject, t.track);
    events.push({
      id: `exam:${t.track.id}`,
      kind: "exam",
      date: t.track.exam_starts_on,
      endDate: t.track.exam_ends_on,
      title,
      href: `/tracks/${t.track.id}`,
      estimate: t.pace.isEstimate,
    });
    if (t.pace.targetDate && t.topics.length > 0) {
      events.push({
        id: `target:${t.track.id}`,
        kind: "target",
        date: t.pace.targetDate,
        title,
        detail: "Cíl: vše naučeno, procvičeno a zopakováno",
        href: `/tracks/${t.track.id}`,
        done: t.pace.state === "done",
      });
    }
  }
  for (const task of input.adminTasks) {
    if (!task.due_on) continue;
    events.push({
      id: `admin:${task.id}`,
      kind: "admin",
      date: task.due_on,
      title: task.title,
      href: "/calendar",
      done: !!task.completed_at,
    });
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || kindOrder(a.kind) - kindOrder(b.kind));
  const upcoming = events.filter((e) => daysBetween(today, e.endDate ?? e.date) >= 0);

  const upcomingExams = upcoming.filter((e) => e.kind === "exam");
  const upcomingAdmin = upcoming.filter((e) => e.kind === "admin" && !e.done);
  const nextExam = upcomingExams[0] ?? null;
  const lastExam = upcomingExams.length ? upcomingExams.reduce((a, b) => ((b.endDate ?? b.date) > (a.endDate ?? a.date) ? b : a)) : null;

  const suggestion: Suggestion | null = suggestNext(
    allTracks.map((t) => ({ id: t.track.id, state: t.pace.state, targetDate: t.pace.targetDate, topics: t.topics })),
  );

  return { today, subjects, allTracks, progress, streak, overall, missing, events, upcoming, upcomingExams, upcomingAdmin, nextExam, lastExam, suggestion };
}

function kindOrder(kind: TimelineEvent["kind"]) {
  return kind === "admin" ? 0 : kind === "target" ? 1 : 2;
}

export type Model = ReturnType<typeof buildModel>;
