import { daysBetween, formatDate, formatDays, isoWeekday, type IsoDate } from "./dates";

export type ReminderPreferences = {
  email_enabled: boolean;
  study_reminder_enabled: boolean;
  study_reminder_weekdays: number[];
  deadline_reminders_enabled: boolean;
  deadline_lead_days: number[];
};

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  email_enabled: true,
  study_reminder_enabled: true,
  study_reminder_weekdays: [1, 2, 3, 4, 5, 6, 7],
  deadline_reminders_enabled: true,
  deadline_lead_days: [7, 1],
};

export type ReminderExam = { id: string; label: string; startsOn: IsoDate };
export type ReminderTask = { id: string; title: string; dueOn: IsoDate };

export type ReminderItem =
  | { kind: "study"; key: string; streak: number }
  | { kind: "exam"; key: string; label: string; date: IsoDate; daysLeft: number }
  | { kind: "task"; key: string; label: string; date: IsoDate; daysLeft: number };

export type ReminderPlan = {
  /** Marks the whole daily email, so at most one email is sent per day. */
  digestKey: string;
  items: ReminderItem[];
};

/**
 * Decides what (if anything) goes into today's reminder email. Everything due
 * today is combined into one message, and each event is keyed so it is never
 * sent twice — the key includes the date, so moving a deadline re-arms it.
 */
export function planReminders(input: {
  today: IsoDate;
  prefs: ReminderPreferences;
  studiedToday: boolean;
  streak: number;
  exams: readonly ReminderExam[];
  tasks: readonly ReminderTask[];
  alreadySent: ReadonlySet<string>;
}): ReminderPlan | null {
  const { today, prefs, alreadySent } = input;
  const digestKey = `digest:${today}`;
  if (!prefs.email_enabled || alreadySent.has(digestKey)) return null;

  const items: ReminderItem[] = [];

  if (prefs.deadline_reminders_enabled) {
    const leads = new Set(prefs.deadline_lead_days);
    for (const exam of input.exams) {
      const daysLeft = daysBetween(today, exam.startsOn);
      const key = `exam:${exam.id}:${exam.startsOn}:${daysLeft}`;
      if (leads.has(daysLeft) && !alreadySent.has(key)) {
        items.push({ kind: "exam", key, label: exam.label, date: exam.startsOn, daysLeft });
      }
    }
    for (const task of input.tasks) {
      const daysLeft = daysBetween(today, task.dueOn);
      const key = `task:${task.id}:${task.dueOn}:${daysLeft}`;
      if (leads.has(daysLeft) && !alreadySent.has(key)) {
        items.push({ kind: "task", key, label: task.title, date: task.dueOn, daysLeft });
      }
    }
  }

  if (
    prefs.study_reminder_enabled &&
    !input.studiedToday &&
    prefs.study_reminder_weekdays.includes(isoWeekday(today)) &&
    !alreadySent.has(`study:${today}`)
  ) {
    items.push({ kind: "study", key: `study:${today}`, streak: input.streak });
  }

  if (items.length === 0) return null;
  items.sort((a, b) => order(a) - order(b));
  return { digestKey, items };
}

function order(item: ReminderItem): number {
  return item.kind === "study" ? 1000 : item.daysLeft;
}

function whenText(daysLeft: number): string {
  if (daysLeft === 0) return "dnes";
  if (daysLeft === 1) return "zítra";
  return `za ${formatDays(daysLeft)}`;
}

/** Czech subject and plain-text/HTML body for a reminder plan. */
export function renderReminderEmail(plan: ReminderPlan, appUrl: string) {
  const deadlines = plan.items.filter((i) => i.kind !== "study");
  const study = plan.items.find((i) => i.kind === "study");

  const subject =
    deadlines.length > 0
      ? `StudyDrive: ${deadlines[0].kind === "exam" ? "blíží se zkouška" : "blíží se termín"} (${whenText(deadlines[0].daysLeft)})`
      : "StudyDrive: dnes ještě není nic zapsáno";

  const lines: string[] = [];
  for (const d of deadlines) {
    const what = d.kind === "exam" ? "Zkouška" : "Termín";
    lines.push(`${what}: ${d.label} — ${whenText(d.daysLeft)} (${formatDate(d.date)})`);
  }
  if (study) {
    lines.push(
      study.streak > 0
        ? `Dnes ještě není zapsané žádné učení. Série ${formatDays(study.streak)} pokračuje, když dnes začneš nebo dokončíš krok.`
        : "Dnes ještě není zapsané žádné učení. Stačí začít jedním krokem.",
    );
  }

  const text = `${lines.join("\n\n")}\n\nOtevřít StudyDrive: ${appUrl}\n\nUpozornění můžeš upravit nebo vypnout v Nastavení.`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1d1d1f">
${lines.map((l) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.5">${escapeHtml(l)}</p>`).join("\n")}
<p style="margin:24px 0"><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#0071e3;color:#fff;text-decoration:none;padding:10px 18px;border-radius:980px;font-size:15px">Otevřít StudyDrive</a></p>
<p style="margin:0;font-size:12px;color:#86868b">Upozornění můžeš upravit nebo vypnout v Nastavení.</p>
</div>`;

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
