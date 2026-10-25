import "server-only";
import { addDays, localDate } from "@/lib/domain/dates";
import { planReminders, renderReminderEmail, type ReminderPreferences } from "@/lib/domain/reminders";
import { computeStreak } from "@/lib/domain/streak";
import { appUrl, isOwnerEmail } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackTitle } from "@/lib/model";

export type JobResult = { users: number; sent: number; skipped: number; failed: number };

async function sendEmail(to: string, email: { subject: string; text: string; html: string }) {
  // RESEND_API_URL is optional (e.g. a local mock in tests); production uses Resend.
  const response = await fetch(process.env.RESEND_API_URL ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL, to: [to], ...email }),
  });
  if (!response.ok) throw new Error(`Email provider responded ${response.status}`);
}

/**
 * Daily reminder run. For each owner with email reminders on: plan at most one
 * digest, claim its dedupe keys in reminder_log (unique per user), then send.
 * If sending fails, the claim is released so the next run can retry.
 */
export async function runReminderJob(now = new Date()): Promise<JobResult> {
  const admin = createAdminClient();
  const result: JobResult = { users: 0, sent: 0, skipped: 0, failed: 0 };

  const { data: prefsRows, error } = await admin.from("reminder_preferences").select("*").eq("email_enabled", true);
  if (error) throw new Error("Could not read reminder preferences");

  for (const prefs of prefsRows ?? []) {
    result.users++;
    try {
      const { data: userData } = await admin.auth.admin.getUserById(prefs.user_id);
      const email = userData.user?.email;
      if (!email || !isOwnerEmail(email)) {
        result.skipped++;
        continue;
      }

      const { data: profile } = await admin.from("profiles").select("timezone").eq("id", prefs.user_id).maybeSingle();
      const today = localDate(now, profile?.timezone ?? "Europe/Prague");

      const [subjects, tracks, tasks, days, sent] = await Promise.all([
        admin.from("subjects").select("id, name, code").eq("user_id", prefs.user_id).is("archived_at", null),
        admin
          .from("exam_tracks")
          .select("id, subject_id, name, exam_starts_on")
          .eq("user_id", prefs.user_id)
          .is("archived_at", null)
          .not("exam_starts_on", "is", null),
        admin
          .from("admin_tasks")
          .select("id, title, due_on")
          .eq("user_id", prefs.user_id)
          .is("archived_at", null)
          .is("completed_at", null)
          .eq("reminders_enabled", true)
          .not("due_on", "is", null),
        admin.from("study_days").select("local_date").eq("user_id", prefs.user_id).gte("local_date", addDays(today, -400)),
        admin.from("reminder_log").select("dedupe_key").eq("user_id", prefs.user_id).gte("sent_at", addDays(today, -90)),
      ]);

      const subjectById = new Map((subjects.data ?? []).map((s) => [s.id, s]));
      const studyDays = (days.data ?? []).map((d) => d.local_date).filter((d): d is string => !!d);
      const streak = computeStreak(studyDays, today);

      const plan = planReminders({
        today,
        prefs: prefs as ReminderPreferences,
        studiedToday: streak.studiedToday,
        streak: streak.current,
        exams: (tracks.data ?? [])
          .filter((t) => subjectById.has(t.subject_id))
          .map((t) => ({ id: t.id, label: trackTitle(subjectById.get(t.subject_id)!, t), startsOn: t.exam_starts_on! })),
        tasks: (tasks.data ?? []).map((t) => ({ id: t.id, title: t.title, dueOn: t.due_on! })),
        alreadySent: new Set((sent.data ?? []).map((r) => r.dedupe_key)),
      });

      if (!plan) {
        result.skipped++;
        continue;
      }

      const keys = [plan.digestKey, ...plan.items.map((i) => i.key)];
      const { error: claimError } = await admin
        .from("reminder_log")
        .insert(keys.map((dedupe_key) => ({ user_id: prefs.user_id, dedupe_key })));
      if (claimError) {
        // Another run already claimed today's digest.
        result.skipped++;
        continue;
      }

      try {
        await sendEmail(email, renderReminderEmail(plan, appUrl()));
        result.sent++;
      } catch {
        await admin.from("reminder_log").delete().eq("user_id", prefs.user_id).in("dedupe_key", keys);
        result.failed++;
      }
    } catch {
      result.failed++;
    }
  }

  return result;
}
