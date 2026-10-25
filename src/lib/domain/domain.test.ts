import { describe, expect, it } from "vitest";
import { addDays, czPlural, daysBetween, formatDateWindow, isoWeekday, localDate, relativeDays } from "./dates";
import { computeTrackPace, roundUpPace, type TrackPaceInput } from "./pace";
import { combine, summarize } from "./progress";
import { pickBlocker, summarizeReadingList, type ReadingWork } from "./reading";
import { planReminders, renderReminderEmail, DEFAULT_REMINDER_PREFERENCES } from "./reminders";
import { canComplete, canReopen, nextStep, type StepState } from "./steps";
import { computeStreak } from "./streak";
import { suggestNext } from "./suggestion";

const at = (iso: string | null) => iso;
const topic = (learn: boolean, practice: boolean, review: boolean): StepState => ({
  learn_completed_at: learn ? at("2026-01-01T10:00:00Z") : null,
  practice_completed_at: practice ? at("2026-01-02T10:00:00Z") : null,
  review_completed_at: review ? at("2026-01-03T10:00:00Z") : null,
});
const withSteps = (n: number) => ({ completed_steps: n });

describe("dates", () => {
  it("uses the Prague calendar day, not UTC", () => {
    // 23:30 UTC on 31 Dec is already 1 Jan in Prague (UTC+1 in winter).
    expect(localDate(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
    // 21:30 UTC on 30 Jun is 23:30 in Prague (UTC+2 in summer) — still 30 Jun.
    expect(localDate(new Date("2027-06-30T21:30:00Z"))).toBe("2027-06-30");
    expect(localDate(new Date("2027-06-30T22:30:00Z"))).toBe("2027-07-01");
  });

  it("counts days across DST changes", () => {
    expect(daysBetween("2027-03-27", "2027-03-29")).toBe(2);
    expect(addDays("2027-10-30", 2)).toBe("2027-11-01");
    expect(isoWeekday("2027-05-03")).toBe(1);
    expect(isoWeekday("2027-05-09")).toBe(7);
  });

  it("formats Czech plurals and relative days", () => {
    expect(czPlural(1, ["den", "dny", "dní"])).toBe("den");
    expect(czPlural(3, ["den", "dny", "dní"])).toBe("dny");
    expect(czPlural(5, ["den", "dny", "dní"])).toBe("dní");
    expect(relativeDays("2027-05-01", "2027-05-01")).toBe("dnes");
    expect(relativeDays("2027-05-01", "2027-05-02")).toBe("zítra");
    expect(relativeDays("2027-05-01", "2027-05-04")).toBe("za 3 dny");
    expect(relativeDays("2027-05-01", "2027-05-11")).toBe("za 10 dní");
    expect(relativeDays("2027-05-04", "2027-05-01")).toBe("před 3 dny");
    expect(formatDateWindow("2027-05-03", "2027-05-06")).toBe("3. 5. – 6. května 2027");
  });
});

describe("steps", () => {
  it("enforces Learn → Practice → Review and allows correcting the latest step", () => {
    const fresh = topic(false, false, false);
    expect(nextStep(fresh)).toBe("learn");
    expect(canComplete(fresh, "practice")).toBe(false);
    const learned = topic(true, false, false);
    expect(canComplete(learned, "practice")).toBe(true);
    expect(canReopen(learned, "learn")).toBe(true);
    const practiced = topic(true, true, false);
    expect(canReopen(practiced, "learn")).toBe(false);
    expect(canReopen(practiced, "practice")).toBe(true);
    expect(nextStep(topic(true, true, true))).toBeNull();
  });
});

describe("streak", () => {
  it("is zero without any study day", () => {
    expect(computeStreak([], "2027-01-10")).toEqual({ current: 0, best: 0, studiedToday: false, lastStudyDay: null });
  });

  it("keeps the streak alive until today is over", () => {
    const s = computeStreak(["2027-01-07", "2027-01-08", "2027-01-09"], "2027-01-10");
    expect(s.current).toBe(3);
    expect(s.studiedToday).toBe(false);
  });

  it("counts today and breaks on a gap", () => {
    const s = computeStreak(["2027-01-01", "2027-01-02", "2027-01-03", "2027-01-08", "2027-01-09", "2027-01-10"], "2027-01-10");
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
    expect(s.studiedToday).toBe(true);
    expect(computeStreak(["2027-01-07"], "2027-01-10").current).toBe(0);
  });

  it("counts each day once", () => {
    expect(computeStreak(["2027-01-10", "2027-01-10"], "2027-01-10").current).toBe(1);
  });
});

describe("progress", () => {
  it("returns null ratio when there is nothing to measure", () => {
    expect(summarize([]).ratio).toBeNull();
    expect(combine([]).ratio).toBeNull();
  });

  it("rolls up topic steps", () => {
    const p = summarize([withSteps(3), withSteps(1), withSteps(0)]);
    expect(p).toMatchObject({ topics: 3, completedTopics: 1, totalSteps: 9, doneSteps: 4, remainingSteps: 5 });
    const all = combine([p, summarize([withSteps(3)])]);
    expect(all).toMatchObject({ topics: 4, completedTopics: 2, doneSteps: 7, totalSteps: 12 });
  });
});

describe("pace", () => {
  const settings = { bufferDays: 14, studyDaysPerWeek: 7, planStartedOn: "2027-01-01" };
  const track = (done: number[], extra: Partial<TrackPaceInput> = {}): TrackPaceInput => ({
    progress: summarize(done.map(withSteps)),
    examStartsOn: "2027-05-15", // target 2027-05-01 → 120 days after plan start
    examEndsOn: null,
    dateStatus: "confirmed",
    firstTopicAddedOn: "2027-01-01",
    ...extra,
  });

  it("reports missing data instead of guessing", () => {
    expect(computeTrackPace(track([]), "2027-02-01", settings).state).toBe("no_topics");
    expect(computeTrackPace(track([0], { examStartsOn: null }), "2027-02-01", settings).state).toBe("no_date");
  });

  it("is on track when following the even plan", () => {
    // 40 topics = 120 steps over 120 days → 1 step/day. On day 30, 30 steps expected.
    const done = Array.from({ length: 40 }, (_, i) => (i < 10 ? 3 : 0)); // 30 steps
    const p = computeTrackPace(track(done), "2027-01-31", settings);
    expect(p.state).toBe("on_track");
    expect(p.targetDate).toBe("2027-05-01");
    expect(p.daysToTarget).toBe(90);
    expect(p.perStudyDay).toBeCloseTo(1, 5);
    expect(p.perWeek).toBeCloseTo(7, 5);
  });

  it("is at risk within a week of the plan and behind beyond it", () => {
    const steps = (n: number) => Array.from({ length: 40 }, (_, i) => (i * 3 + 3 <= n ? 3 : Math.max(0, n - i * 3)));
    expect(computeTrackPace(track(steps(25)), "2027-01-31", settings).state).toBe("at_risk"); // 5 behind
    expect(computeTrackPace(track(steps(15)), "2027-01-31", settings).state).toBe("behind"); // 15 behind
  });

  it("is behind when the target has passed with work left, using days until the exam", () => {
    const p = computeTrackPace(track([3, 0]), "2027-05-05", settings);
    expect(p.state).toBe("behind");
    expect(p.daysToTarget).toBeLessThan(0);
    expect(p.perStudyDay).toBeCloseTo(3 / 10, 5);
  });

  it("marks provisional dates and windows as estimates", () => {
    const p = computeTrackPace(track([0], { dateStatus: "provisional", examEndsOn: "2027-06-10" }), "2027-01-31", settings);
    expect(p.isEstimate).toBe(true);
    expect(p.estimateReasons).toEqual(["provisional_date", "date_window"]);
  });

  it("handles completed tracks and past exams", () => {
    expect(computeTrackPace(track([3, 3]), "2027-02-01", settings).state).toBe("done");
    expect(computeTrackPace(track([0]), "2027-05-20", settings).state).toBe("exam_passed");
  });

  it("accounts for fewer study days per week", () => {
    const done = Array.from({ length: 40 }, (_, i) => (i < 10 ? 3 : 0));
    const p = computeTrackPace(track(done), "2027-01-31", { ...settings, studyDaysPerWeek: 5 });
    expect(p.perStudyDay).toBeCloseTo(90 / (90 * (5 / 7)), 5);
  });

  it("rounds pace up for display", () => {
    expect(roundUpPace(1.2)).toBe(2);
    expect(roundUpPace(0.34)).toBe(0.3);
    expect(roundUpPace(null)).toBeNull();
  });
});

describe("suggestion", () => {
  const t = (id: string, position: number, s: StepState) => ({ id, title: id, position, ...s });

  it("prefers the track that is behind and continues a started topic", () => {
    const s = suggestNext([
      { id: "a", state: "on_track", targetDate: "2027-04-01", topics: [t("a1", 0, topic(false, false, false))] },
      {
        id: "b",
        state: "behind",
        targetDate: "2027-05-01",
        topics: [t("b1", 0, topic(true, true, true)), t("b2", 1, topic(false, false, false)), t("b3", 2, topic(true, false, false))],
      },
    ]);
    expect(s).toMatchObject({ trackId: "b", topicId: "b3", step: "practice", reason: "behind" });
  });

  it("returns null when nothing is open", () => {
    expect(suggestNext([])).toBeNull();
    expect(suggestNext([{ id: "a", state: "done", targetDate: null, topics: [t("a1", 0, topic(true, true, true))] }])).toBeNull();
  });
});

describe("reminders", () => {
  const base = {
    today: "2027-04-24", // Saturday
    prefs: DEFAULT_REMINDER_PREFERENCES,
    studiedToday: false,
    streak: 4,
    exams: [{ id: "e1", label: "Matematika — didaktický test", startsOn: "2027-05-01" }],
    tasks: [{ id: "t1", title: "Odevzdat seznam četby", dueOn: "2027-04-25" }],
    alreadySent: new Set<string>(),
  };

  it("combines everything due today into one email", () => {
    const plan = planReminders(base)!;
    expect(plan.digestKey).toBe("digest:2027-04-24");
    expect(plan.items.map((i) => i.kind)).toEqual(["task", "exam", "study"]);
    const email = renderReminderEmail(plan, "https://example.test");
    expect(email.subject).toContain("zítra");
    expect(email.text).toContain("Odevzdat seznam četby");
  });

  it("sends at most one email per day and never repeats an event", () => {
    expect(planReminders({ ...base, alreadySent: new Set(["digest:2027-04-24"]) })).toBeNull();
    const plan = planReminders({ ...base, alreadySent: new Set(["exam:e1:2027-05-01:7"]) })!;
    expect(plan.items.some((i) => i.kind === "exam")).toBe(false);
  });

  it("skips the study reminder after studying and respects switches", () => {
    expect(planReminders({ ...base, studiedToday: true })!.items.some((i) => i.kind === "study")).toBe(false);
    expect(planReminders({ ...base, prefs: { ...base.prefs, email_enabled: false } })).toBeNull();
    expect(
      planReminders({
        ...base,
        tasks: [],
        exams: [],
        prefs: { ...base.prefs, study_reminder_weekdays: [1, 2, 3, 4, 5] },
      }),
    ).toBeNull();
  });
});

describe("reading list", () => {
  let n = 0;
  const work = (period: ReadingWork["period"], form: ReadingWork["form"] = "prose", author = `a${++n}`): ReadingWork => ({
    id: `w${++n}`,
    author_key: author,
    period,
    form,
  });
  const valid = (): ReadingWork[] => [
    work("before_1800", "drama"),
    work("before_1800", "drama"),
    work("century_19", "poetry"),
    work("century_19", "poetry"),
    work("century_19"),
    ...Array.from({ length: 4 }, () => work("world_modern")),
    ...Array.from({ length: 11 }, () => work("czech_modern")),
  ];

  it("accepts a list that meets every rule", () => {
    const summary = summarizeReadingList(valid());
    expect(summary.count).toBe(20);
    expect(summary.complete).toBe(true);
  });

  it("is incomplete while a minimum is missing", () => {
    const list = valid().slice(0, 19);
    expect(summarizeReadingList(list).complete).toBe(false);
  });

  it("refuses a 21st work and a third work by one author", () => {
    expect(pickBlocker(valid(), work("czech_modern"))).toMatch(/20/);
    const picked = [work("czech_modern", "prose", "capek"), work("czech_modern", "drama", "capek")];
    expect(pickBlocker(picked, work("czech_modern", "prose", "capek"))).toMatch(/autora/);
    expect(pickBlocker(picked, work("czech_modern", "prose", "hrabal"))).toBeNull();
  });

  it("keeps enough slots for the missing period minimums", () => {
    // 6 free picks beyond the 14 required ones, all spent on Czech modern works.
    const picked = [...Array.from({ length: 11 }, () => work("czech_modern"))];
    expect(pickBlocker(picked, work("czech_modern"))).toMatch(/18. století/);
    expect(pickBlocker(picked, work("before_1800"))).toBeNull();
  });

  it("keeps enough slots for poetry and drama", () => {
    const picked = [
      work("before_1800"),
      work("before_1800"),
      ...Array.from({ length: 3 }, () => work("century_19")),
      ...Array.from({ length: 4 }, () => work("world_modern")),
      ...Array.from({ length: 7 }, () => work("czech_modern")),
    ];
    // 16 prose works picked: the last 4 slots must go to poetry and drama.
    expect(pickBlocker(picked, work("czech_modern"))).toMatch(/poezie, drama/);
    expect(pickBlocker(picked, work("czech_modern", "poetry"))).toBeNull();
  });
});
