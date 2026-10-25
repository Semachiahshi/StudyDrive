import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { requireOwner } from "@/lib/auth";
import { localDate } from "@/lib/domain/dates";
import { buildModel } from "@/lib/model";
import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];
export type SubjectRow = Tables["subjects"]["Row"];
export type TrackRow = Tables["exam_tracks"]["Row"];
export type TopicRow = Tables["topics"]["Row"];
export type AdminTaskRow = Tables["admin_tasks"]["Row"];
export type ProfileRow = Tables["profiles"]["Row"];
export type ReminderPrefsRow = Tables["reminder_preferences"]["Row"];
export type FileRow = Tables["study_files"]["Row"];
export type NoteRow = Tables["notes"]["Row"];
export type ReadingWorkRow = Tables["reading_works"]["Row"];
export type SessionRow = Tables["study_sessions"]["Row"] & { topics: { title: string; track_id: string } | null };

export type StudyData = {
  today: string;
  profile: ProfileRow;
  subjects: SubjectRow[];
  tracks: TrackRow[];
  topics: TopicRow[];
  adminTasks: AdminTaskRow[];
  studyDays: string[];
  activeSession: SessionRow | null;
};

function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Načtení ${what} selhalo: ${result.error.message}`);
  return result.data as T;
}

/** Everything the overview, subject and calendar screens need, read as the owner (RLS applies). */
export const loadStudyData = cache(async (): Promise<StudyData> => {
  const { supabase, userId } = await requireOwner();

  const [profile, subjects, tracks, topics, adminTasks, days, session] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("subjects").select("*").order("position").order("created_at"),
    supabase.from("exam_tracks").select("*").order("position").order("created_at"),
    supabase.from("topics").select("*").order("position").order("created_at"),
    supabase.from("admin_tasks").select("*").is("archived_at", null).order("due_on", { nullsFirst: false }),
    supabase.from("study_days").select("local_date").order("local_date", { ascending: false }).limit(800),
    supabase.from("study_sessions").select("*, topics(title, track_id)").is("ended_at", null).maybeSingle(),
  ]);

  const profileRow = check(profile, "profilu");
  const timeZone = profileRow?.timezone ?? "Europe/Prague";

  return {
    today: localDate(new Date(), timeZone),
    profile: profileRow ?? {
      id: userId,
      display_name: null,
      timezone: "Europe/Prague",
      buffer_days: 14,
      study_days_per_week: 7,
      plan_started_on: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    subjects: check(subjects, "předmětů"),
    tracks: check(tracks, "okruhů"),
    topics: check(topics, "témat"),
    adminTasks: check(adminTasks, "termínů"),
    studyDays: (check(days, "studijních dnů") ?? []).map((d) => d.local_date).filter((d): d is string => !!d),
    activeSession: check(session, "relace") as SessionRow | null,
  };
});

/** Study data plus the computed view model (progress, pace, streak, timeline). */
export const loadModel = cache(async () => {
  const data = await loadStudyData();
  const model = buildModel({
    today: data.today,
    timeZone: data.profile.timezone,
    settings: {
      bufferDays: data.profile.buffer_days,
      studyDaysPerWeek: data.profile.study_days_per_week,
      planStartedOn: data.profile.plan_started_on,
    },
    subjects: data.subjects,
    tracks: data.tracks,
    topics: data.topics,
    adminTasks: data.adminTasks,
    studyDays: data.studyDays,
  });
  return { data, model };
});

export const loadReminderPreferences = cache(async () => {
  const { supabase, userId } = await requireOwner();
  return check(await supabase.from("reminder_preferences").select("*").eq("user_id", userId).maybeSingle(), "upozornění");
});

export const loadFilesAndNotes = cache(async () => {
  const { supabase, userId } = await requireOwner();
  const [files, notes] = await Promise.all([
    supabase.from("study_files").select("*").order("created_at", { ascending: false }),
    supabase.from("notes").select("*").order("updated_at", { ascending: false }),
  ]);
  return { userId, files: check(files, "souborů"), notes: check(notes, "poznámek") };
});

/** The school's reading list attached to an exam track (empty for most tracks). */
export const loadReadingWorks = cache(async (trackId: string) => {
  const { supabase } = await requireOwner();
  return check(
    await supabase.from("reading_works").select("*").eq("track_id", trackId).order("position").order("author"),
    "seznamu četby",
  );
});

/** Finds an item loaded for the owner, or shows the 404 page. */
export function requireItem<T>(items: T[], predicate: (item: T) => boolean): T {
  const item = items.find(predicate);
  if (!item) notFound();
  return item;
}
