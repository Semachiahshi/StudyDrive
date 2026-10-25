import type { Metadata } from "next";
import { updatePaceSettings, updateReminderPreferences } from "../actions";
import { InlineForm } from "@/components/forms";
import { Icon } from "@/components/icon";
import { Card, Field, Input, PageHeader, Section, Select, Toggle, cx } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { loadReminderPreferences, loadStudyData } from "@/lib/data";
import { formatDays } from "@/lib/domain/dates";
import { DEFAULT_REMINDER_PREFERENCES } from "@/lib/domain/reminders";
import { configurationStatus, remindersConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Nastavení" };

const WEEKDAYS = [
  [1, "Po"],
  [2, "Út"],
  [3, "St"],
  [4, "Čt"],
  [5, "Pá"],
  [6, "So"],
  [7, "Ne"],
] as const;
const LEAD_OPTIONS = [30, 14, 7, 3, 1, 0];

function Chip({ name, value, checked, children }: { name: string; value: number; checked: boolean; children: React.ReactNode }) {
  return (
    <label className="relative">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="touch-target inline-flex min-h-9 min-w-11 cursor-pointer items-center justify-center rounded-full bg-fill px-3 text-footnote font-semibold text-label-2 transition peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:ring-3 peer-focus-visible:ring-accent-tint">
        {children}
      </span>
    </label>
  );
}

export default async function SettingsPage() {
  const [{ email }, data, prefsRow] = await Promise.all([requireOwner(), loadStudyData(), loadReminderPreferences()]);
  const profile = data.profile;
  const prefs = prefsRow ?? { ...DEFAULT_REMINDER_PREFERENCES };
  const config = configurationStatus();
  const emailReady = remindersConfigured();

  return (
    <>
      <PageHeader title="Nastavení" />

      <Section title="Tempo" description="Předpoklady, ze kterých se počítá stav a potřebné tempo. Kdykoli je můžeš změnit.">
        <div id="tempo" className="scroll-mt-6" />
        <Card>
          <InlineForm action={updatePaceSettings}>
            <div className="grid gap-4 p-4 sm:grid-cols-3">
              <Field label="Rezerva před zkouškou" htmlFor="buffer" hint={`Vše má být hotové ${formatDays(profile.buffer_days)} před zkouškou.`}>
                <Input id="buffer" name="buffer_days" type="number" min={0} max={120} required defaultValue={profile.buffer_days} />
              </Field>
              <Field label="Studijní dny v týdnu" htmlFor="days" hint="Kolik dní v týdnu počítáš s učením.">
                <Select id="days" name="study_days_per_week" defaultValue={profile.study_days_per_week}>
                  {[7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} z 7
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Začátek přípravy" htmlFor="start" hint="Prázdné = den, kdy přibylo první téma okruhu.">
                <Input id="start" name="plan_started_on" type="date" defaultValue={profile.plan_started_on ?? ""} />
              </Field>
            </div>
          </InlineForm>
        </Card>
      </Section>

      <Section
        title="E-mailová upozornění"
        description="Nejvýš jeden souhrnný e-mail denně. Každá připomínka se pošle jen jednou."
      >
        {!emailReady && (
          <div className="mb-3 flex items-start gap-2 rounded-card bg-orange-tint px-4 py-3 text-footnote text-orange">
            <Icon name="info" size={16} className="mt-px shrink-0" />
            <span>
              Odesílání e-mailů zatím není nastavené, takže se nic neposílá. Předvolby si ale můžeš uložit už teď — viz stav
              připojení níže.
            </span>
          </div>
        )}
        <Card>
          <InlineForm action={updateReminderPreferences}>
            <div className="divide-y divide-separator">
              <Toggle name="email_enabled" defaultChecked={prefs.email_enabled} label="Posílat upozornění e-mailem" description={`Na ${email}`} />
              <div>
                <Toggle
                  name="study_reminder_enabled"
                  defaultChecked={prefs.study_reminder_enabled}
                  label="Připomenout učení"
                  description="Večer, jen když ten den ještě není zapsané žádné učení."
                />
                <div className="flex flex-wrap gap-1.5 px-4 pb-3" role="group" aria-label="Dny připomínky učení">
                  {WEEKDAYS.map(([n, label]) => (
                    <Chip key={n} name="study_reminder_weekdays" value={n} checked={prefs.study_reminder_weekdays.includes(n)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <Toggle
                  name="deadline_reminders_enabled"
                  defaultChecked={prefs.deadline_reminders_enabled}
                  label="Připomenout zkoušky a termíny"
                  description="Kolik dní předem (nejvýš 5 voleb). 0 = v daný den."
                />
                <div className="flex flex-wrap gap-1.5 px-4 pb-3" role="group" aria-label="Předstih připomínek">
                  {LEAD_OPTIONS.map((n) => (
                    <Chip key={n} name="deadline_lead_days" value={n} checked={prefs.deadline_lead_days.includes(n)}>
                      {n === 0 ? "V den" : n === 1 ? "1 den" : `${n} dní`}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          </InlineForm>
        </Card>
      </Section>

      <Section title="Účet">
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-subheadline font-medium">{email}</p>
            <p className="text-footnote text-label-2">Soukromý účet. Přihlášení jednorázovým kódem z e-mailu.</p>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="touch-target inline-flex min-h-10 items-center gap-1.5 rounded-full bg-fill px-4 text-subheadline font-semibold hover:bg-fill-strong">
              <Icon name="signOut" size={18} />
              Odhlásit se
            </button>
          </form>
        </Card>
      </Section>

      <Section title="Stav připojení" description="Jen názvy a jestli jsou nastavené — hodnoty se nikdy nezobrazují.">
        <Card className="divide-y divide-separator">
          {config.map((c) => (
            <div key={c.name} className="flex items-start gap-3 px-4 py-2.5">
              <Icon
                name={c.ok ? "checkCircle" : "circle"}
                size={18}
                className={cx("mt-0.5 shrink-0", c.ok ? "text-green" : "text-label-3")}
                label={c.ok ? "Nastaveno" : "Chybí"}
              />
              <div className="min-w-0">
                <code className="text-footnote font-semibold">{c.name}</code>
                <p className="text-caption text-label-2">{c.purpose}</p>
              </div>
            </div>
          ))}
        </Card>
      </Section>
    </>
  );
}
