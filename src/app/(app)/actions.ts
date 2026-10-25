"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { requireOwner } from "@/lib/auth";
import { STEPS } from "@/lib/domain/steps";

// ---------------------------------------------------------------- helpers

const uuid = z.uuid();
const isoDate = z.iso.date();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));
const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(isoDate.nullable());
const optionalId = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(uuid.nullable());

function form(fd: FormData) {
  return Object.fromEntries([...fd.keys()].map((k) => [k, fd.getAll(k).length > 1 ? fd.getAll(k) : fd.get(k)]));
}

function done(): ActionState {
  revalidatePath("/", "layout");
  return ok();
}

function dbError(error: { message: string; code?: string } | null, fallback = "Uložení se nepovedlo. Zkus to znovu."): ActionState {
  if (!error) return done();
  if (error.code === "23503") return fail("Vybraná položka už neexistuje.");
  if (error.code === "23514") return fail("Zkontroluj zadané hodnoty.");
  return fail(fallback);
}

function firstIssue(error: z.ZodError, messages: Record<string, string> = {}) {
  const issue = error.issues[0];
  const field = String(issue?.path[0] ?? "");
  return messages[field] ?? "Zkontroluj zadané hodnoty.";
}

type Client = Awaited<ReturnType<typeof requireOwner>>["supabase"];
type Entity = "subject" | "track" | "topic";

/** Active siblings in display order (subjects; tracks of a subject; topics of a track). */
async function siblings(supabase: Client, entity: Entity, parentId: string | null) {
  const query =
    entity === "subject"
      ? supabase.from("subjects").select("id, position")
      : entity === "track"
        ? supabase.from("exam_tracks").select("id, position").eq("subject_id", parentId ?? "")
        : supabase.from("topics").select("id, position").eq("track_id", parentId ?? "");
  const { data } = await query.is("archived_at", null).order("position").order("created_at");
  return data ?? [];
}

async function nextPosition(supabase: Client, entity: Entity, parentId: string | null = null) {
  const rows = await siblings(supabase, entity, parentId);
  return rows.reduce((max, r) => Math.max(max, r.position), -1) + 1;
}

// ---------------------------------------------------------------- subjects

const subjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: optionalText(12),
  notes: optionalText(5000),
});
const subjectMessages = { name: "Zadej název předmětu (max. 120 znaků).", code: "Zkratka může mít nejvýše 12 znaků." };

export async function createSubject(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = subjectSchema.safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, subjectMessages));
  const position = await nextPosition(supabase, "subject");
  const { error } = await supabase.from("subjects").insert({ ...parsed.data, position });
  return dbError(error);
}

export async function updateSubject(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = subjectSchema.extend({ id: uuid }).safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, subjectMessages));
  const { id, ...values } = parsed.data;
  const { error } = await supabase.from("subjects").update(values).eq("id", id);
  return dbError(error);
}

// ---------------------------------------------------------------- exam tracks

const trackSchema = z
  .object({
    subject_id: uuid,
    name: z.string().trim().min(1).max(120),
    kind: z.enum(["didactic_test", "essay", "oral", "practical", "other"]),
    exam_starts_on: optionalDate,
    exam_ends_on: optionalDate,
    exam_date_status: z.enum(["provisional", "confirmed"]),
    notes: optionalText(5000),
  })
  .refine((v) => !v.exam_ends_on || (v.exam_starts_on && v.exam_ends_on >= v.exam_starts_on), {
    path: ["exam_ends_on"],
  });
const trackMessages = {
  name: "Zadej název okruhu (max. 120 znaků).",
  exam_starts_on: "Zadej platné datum.",
  exam_ends_on: "Konec okna musí být stejný nebo pozdější než začátek.",
};

export async function createTrack(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = trackSchema.safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, trackMessages));
  const position = await nextPosition(supabase, "track", parsed.data.subject_id);
  const { error } = await supabase.from("exam_tracks").insert({ ...parsed.data, position });
  return dbError(error);
}

export async function updateTrack(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = trackSchema.safeParse(form(fd));
  const id = uuid.safeParse(fd.get("id"));
  if (!parsed.success) return fail(firstIssue(parsed.error, trackMessages));
  if (!id.success) return fail("Okruh nebyl nalezen.");
  const { error } = await supabase.from("exam_tracks").update(parsed.data).eq("id", id.data);
  return dbError(error);
}

// ---------------------------------------------------------------- topics

export async function createTopics(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const trackId = uuid.safeParse(fd.get("track_id"));
  if (!trackId.success) return fail("Okruh nebyl nalezen.");
  const titles = String(fd.get("titles") ?? "")
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (titles.length === 0) return fail("Zadej aspoň jedno téma.");
  if (titles.length > 200) return fail("Najednou lze přidat nejvýše 200 témat.");
  if (titles.some((t) => t.length > 300)) return fail("Název tématu může mít nejvýše 300 znaků.");
  const start = await nextPosition(supabase, "topic", trackId.data);
  const { error } = await supabase
    .from("topics")
    .insert(titles.map((title, i) => ({ track_id: trackId.data, title, position: start + i })));
  return dbError(error);
}

export async function updateTopic(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = z
    .object({ id: uuid, title: z.string().trim().min(1).max(300), notes: optionalText(10000) })
    .safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, { title: "Zadej název tématu (max. 300 znaků)." }));
  const { id, ...values } = parsed.data;
  const { error } = await supabase.from("topics").update(values).eq("id", id);
  return dbError(error);
}

// ---------------------------------------------------------------- shared: archive, delete, reorder

const ENTITY = {
  subject: "subjects",
  track: "exam_tracks",
  topic: "topics",
} as const;
const entitySchema = z.object({ entity: z.enum(["subject", "track", "topic"]), id: uuid });

export async function setArchived(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = entitySchema.extend({ archived: z.enum(["true", "false"]) }).safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { entity, id, archived } = parsed.data;
  const { error } = await supabase
    .from(ENTITY[entity])
    .update({ archived_at: archived === "true" ? new Date().toISOString() : null })
    .eq("id", id);
  return dbError(error);
}

export async function deleteEntity(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = entitySchema.safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { error } = await supabase.from(ENTITY[parsed.data.entity]).delete().eq("id", parsed.data.id);
  const result = dbError(error, "Smazání se nepovedlo.");
  // When deleting from the item's own page, continue to its parent.
  const target = String(fd.get("redirect_to") ?? "");
  if (result?.ok && /^\/[a-z0-9/-]*$/i.test(target)) redirect(target);
  return result;
}

export async function moveEntity(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = entitySchema.extend({ direction: z.enum(["up", "down"]) }).safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { entity, id, direction } = parsed.data;

  let parentId: string | null = null;
  if (entity === "track") {
    const { data } = await supabase.from("exam_tracks").select("subject_id").eq("id", id).maybeSingle();
    if (!data) return fail("Položka nebyla nalezena.");
    parentId = data.subject_id;
  } else if (entity === "topic") {
    const { data } = await supabase.from("topics").select("track_id").eq("id", id).maybeSingle();
    if (!data) return fail("Položka nebyla nalezena.");
    parentId = data.track_id;
  }

  const ordered = await siblings(supabase, entity, parentId);
  const index = ordered.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return ok();

  // Renumber densely so equal positions cannot get stuck.
  [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];
  const table = ENTITY[entity];
  const results = await Promise.all(
    ordered.map((s, i) => (s.position === i ? null : supabase.from(table).update({ position: i }).eq("id", s.id))),
  );
  const error = results.find((r) => r?.error)?.error ?? null;
  return dbError(error, "Pořadí se nepodařilo změnit.");
}

// ---------------------------------------------------------------- steps and study sessions

const stepSchema = z.object({ topic_id: uuid, step: z.enum(STEPS) });

export async function completeStep(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = stepSchema.safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { error } = await supabase.rpc("complete_topic_step", { p_topic_id: parsed.data.topic_id, p_step: parsed.data.step });
  return dbError(error, "Krok nejde označit — nejdřív dokonči předchozí krok.");
}

export async function reopenStep(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = stepSchema.safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { error } = await supabase.rpc("reopen_topic_step", { p_topic_id: parsed.data.topic_id, p_step: parsed.data.step });
  return dbError(error, "Vrátit jde jen poslední dokončený krok.");
}

export async function startSession(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = z
    .object({
      topic_id: optionalId.optional(),
      step: z
        .string()
        .transform((v) => (v === "" ? null : v))
        .pipe(z.enum(STEPS).nullable())
        .optional(),
    })
    .safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { error } = await supabase.rpc("start_study_session", {
    p_topic_id: parsed.data.topic_id ?? undefined,
    p_step: parsed.data.step ?? undefined,
  });
  return dbError(error, "Učení se nepodařilo zahájit.");
}

export async function endSession(_: ActionState, _fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.rpc("end_study_session");
  return dbError(error);
}

// ---------------------------------------------------------------- administrative tasks

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  due_on: optionalDate,
  subject_id: optionalId,
  notes: optionalText(5000),
  reminders_enabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
const taskMessages = { title: "Zadej název (max. 200 znaků).", due_on: "Zadej platné datum." };

export async function createTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = taskSchema.safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, taskMessages));
  const { error } = await supabase.from("admin_tasks").insert(parsed.data);
  return dbError(error);
}

export async function updateTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = taskSchema.extend({ id: uuid }).safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, taskMessages));
  const { id, ...values } = parsed.data;
  const { error } = await supabase.from("admin_tasks").update(values).eq("id", id);
  return dbError(error);
}

export async function setTaskDone(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = z.object({ id: uuid, done: z.enum(["true", "false"]) }).safeParse(form(fd));
  if (!parsed.success) return fail("Neplatný požadavek.");
  const { error } = await supabase
    .from("admin_tasks")
    .update({ completed_at: parsed.data.done === "true" ? new Date().toISOString() : null })
    .eq("id", parsed.data.id);
  return dbError(error);
}

export async function deleteTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const id = uuid.safeParse(fd.get("id"));
  if (!id.success) return fail("Neplatný požadavek.");
  const { error } = await supabase.from("admin_tasks").delete().eq("id", id.data);
  return dbError(error, "Smazání se nepovedlo.");
}

// ---------------------------------------------------------------- files and notes

const assignmentSchema = z.object({ subject_id: optionalId, track_id: optionalId, topic_id: optionalId });

export async function registerFile(input: {
  storage_path: string;
  display_name: string;
  mime_type: string | null;
  size_bytes: number;
  subject_id: string | null;
  track_id: string | null;
  topic_id: string | null;
}): Promise<ActionState> {
  const { supabase, userId } = await requireOwner();
  const parsed = assignmentSchema
    .extend({
      storage_path: z.string().startsWith(`${userId}/`).max(500),
      display_name: z.string().trim().min(1).max(200),
      mime_type: z.string().max(200).nullable(),
      size_bytes: z.number().int().min(0),
    })
    .safeParse({ ...input, subject_id: input.subject_id ?? "", track_id: input.track_id ?? "", topic_id: input.topic_id ?? "" });
  if (!parsed.success) return fail("Soubor se nepodařilo uložit.");
  const { error } = await supabase.from("study_files").insert(parsed.data);
  if (error) {
    await supabase.storage.from("study-files").remove([parsed.data.storage_path]);
    return dbError(error, "Soubor se nepodařilo uložit.");
  }
  return done();
}

export async function updateFile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = assignmentSchema
    .extend({ id: uuid, display_name: z.string().trim().min(1).max(200) })
    .safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, { display_name: "Zadej název (max. 200 znaků)." }));
  const { id, ...values } = parsed.data;
  const { error } = await supabase.from("study_files").update(values).eq("id", id);
  return dbError(error);
}

export async function deleteFile(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const id = uuid.safeParse(fd.get("id"));
  if (!id.success) return fail("Neplatný požadavek.");
  const { data: file } = await supabase.from("study_files").select("storage_path").eq("id", id.data).maybeSingle();
  if (!file) return fail("Soubor nebyl nalezen.");
  const { error: storageError } = await supabase.storage.from("study-files").remove([file.storage_path]);
  if (storageError) return fail("Soubor se nepodařilo smazat z úložiště.");
  const { error } = await supabase.from("study_files").delete().eq("id", id.data);
  return dbError(error, "Smazání se nepovedlo.");
}

const noteSchema = assignmentSchema.extend({
  title: z.string().trim().min(1).max(200),
  body: z.string().max(50000),
});
const noteMessages = { title: "Zadej název poznámky (max. 200 znaků).", body: "Poznámka je příliš dlouhá." };

export async function createNote(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = noteSchema.safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, noteMessages));
  const { error } = await supabase.from("notes").insert(parsed.data);
  return dbError(error);
}

export async function updateNote(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const parsed = noteSchema.extend({ id: uuid }).safeParse(form(fd));
  if (!parsed.success) return fail(firstIssue(parsed.error, noteMessages));
  const { id, ...values } = parsed.data;
  const { error } = await supabase.from("notes").update(values).eq("id", id);
  return dbError(error);
}

export async function deleteNote(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase } = await requireOwner();
  const id = uuid.safeParse(fd.get("id"));
  if (!id.success) return fail("Neplatný požadavek.");
  const { error } = await supabase.from("notes").delete().eq("id", id.data);
  return dbError(error, "Smazání se nepovedlo.");
}

// ---------------------------------------------------------------- settings

export async function updatePaceSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireOwner();
  const parsed = z
    .object({
      buffer_days: z.coerce.number().int().min(0).max(120),
      study_days_per_week: z.coerce.number().int().min(1).max(7),
      plan_started_on: optionalDate,
    })
    .safeParse(form(fd));
  if (!parsed.success) {
    return fail(
      firstIssue(parsed.error, {
        buffer_days: "Rezerva musí být 0–120 dní.",
        study_days_per_week: "Počet studijních dnů musí být 1–7.",
        plan_started_on: "Zadej platné datum.",
      }),
    );
  }
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  return dbError(error);
}

export async function updateReminderPreferences(_: ActionState, fd: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireOwner();
  const weekdays = fd.getAll("study_reminder_weekdays").map(Number);
  const leadDays = fd.getAll("deadline_lead_days").map(Number);
  const parsed = z
    .object({
      email_enabled: z.boolean(),
      study_reminder_enabled: z.boolean(),
      deadline_reminders_enabled: z.boolean(),
      study_reminder_weekdays: z.array(z.number().int().min(1).max(7)).max(7),
      deadline_lead_days: z.array(z.number().int().min(0).max(60)).max(5),
    })
    .safeParse({
      email_enabled: fd.get("email_enabled") === "on",
      study_reminder_enabled: fd.get("study_reminder_enabled") === "on",
      deadline_reminders_enabled: fd.get("deadline_reminders_enabled") === "on",
      study_reminder_weekdays: [...new Set(weekdays)].sort(),
      deadline_lead_days: [...new Set(leadDays)].sort((a, b) => b - a),
    });
  if (!parsed.success) return fail("Vyber nejvýše 5 předstihů v rozmezí 0–60 dní.");
  const { error } = await supabase.from("reminder_preferences").update(parsed.data).eq("user_id", userId);
  return dbError(error);
}
