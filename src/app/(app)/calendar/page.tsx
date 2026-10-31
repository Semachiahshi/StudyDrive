import type { Metadata } from "next";
import Link from "next/link";
import { createTask, deleteTask, setTaskDone, updateTask } from "../actions";
import { TRACK_KIND_LABEL } from "@/components/fields";
import { ActionButton, SheetForm } from "@/components/forms";
import { Icon } from "@/components/icon";
import { Card, EmptyState, Field, Input, PageHeader, Section, Select, StatusBadge, Textarea, cx } from "@/components/ui";
import { loadModel, type AdminTaskRow, type SubjectRow } from "@/lib/data";
import { daysBetween, formatDate, formatDateWindow, relativeDays } from "@/lib/domain/dates";
import { trackTitle } from "@/lib/model";

export const metadata: Metadata = { title: "Kalendář" };

function TaskFields({ task, subjects }: { task?: AdminTaskRow; subjects: SubjectRow[] }) {
  const p = task?.id ?? "new";
  return (
    <>
      {task && <input type="hidden" name="id" value={task.id} />}
      <Field label="Co je potřeba udělat" htmlFor={`task-title-${p}`}>
        <Input id={`task-title-${p}`} name="title" required maxLength={200} defaultValue={task?.title} placeholder="Např. Podat přihlášku k maturitě" />
      </Field>
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
        <Field label="Termín (nejpozději do)" htmlFor={`task-due-${p}`}>
          <Input id={`task-due-${p}`} name="due_on" type="date" defaultValue={task?.due_on ?? ""} />
        </Field>
        <Field label="Předmět (nepovinné)" htmlFor={`task-subject-${p}`}>
          <Select id={`task-subject-${p}`} name="subject_id" defaultValue={task?.subject_id ?? ""}>
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <label className="flex items-center gap-2 px-1 text-subheadline">
        <input type="checkbox" name="reminders_enabled" defaultChecked={task?.reminders_enabled ?? true} className="size-5 accent-[var(--accent)]" />
        Připomenout e-mailem předem
      </label>
      <Field label="Poznámka" htmlFor={`task-notes-${p}`}>
        <Textarea id={`task-notes-${p}`} name="notes" maxLength={5000} defaultValue={task?.notes ?? ""} />
      </Field>
    </>
  );
}

export default async function CalendarPage() {
  const { data, model } = await loadModel();
  const activeSubjects = data.subjects.filter((s) => !s.archived_at);
  const dated = model.allTracks
    .filter((t) => t.track.exam_starts_on)
    .sort((a, b) => a.track.exam_starts_on!.localeCompare(b.track.exam_starts_on!));
  const undated = model.allTracks.filter((t) => !t.track.exam_starts_on);
  const openTasks = data.adminTasks
    .filter((t) => !t.completed_at)
    .sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999"));
  const doneTasks = data.adminTasks.filter((t) => t.completed_at);

  const addTask = (
    <SheetForm action={createTask} title="Nový administrativní termín" trigger="Přidat termín" triggerIcon="plus" triggerVariant="filled" submitLabel="Přidat">
      <TaskFields subjects={activeSubjects} />
    </SheetForm>
  );

  return (
    <>
      <PageHeader title="Kalendář" subtitle="Zkoušky a administrativní termíny odděleně" actions={addTask} />

      <Section title="Zkoušky" description="Datum nebo okno zkoušky se nastavuje u okruhu. Cíl přípravy je o rezervu dřív.">
        {dated.length === 0 && undated.length === 0 ? (
          <EmptyState icon="calendar" title="Zatím žádné zkoušky" action={<Link href="/subjects" className="text-subheadline font-semibold text-accent-text">Přejít na předměty</Link>}>
            Nejdřív přidej předmět a okruh zkoušky. Termín pak zadáš u okruhu — přesné datum, nebo jen okno, když přesné datum
            ještě není známé.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-separator overflow-hidden">
            {dated.map((t) => {
              const passed = daysBetween(model.today, t.track.exam_ends_on ?? t.track.exam_starts_on!) < 0;
              return (
                <Link key={t.track.id} href={`/tracks/${t.track.id}`} className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-fill", passed && "opacity-60")}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subheadline font-semibold">{trackTitle(t.subject, t.track)}</p>
                    <p className="text-footnote text-label-2">
                      {TRACK_KIND_LABEL[t.track.kind]} · {formatDateWindow(t.track.exam_starts_on!, t.track.exam_ends_on)}
                      {t.track.exam_date_status === "provisional" ? " · předběžně" : " · potvrzeno"}
                      {t.pace.targetDate && t.topics.length > 0 && ` · cíl přípravy ${formatDate(t.pace.targetDate)}`}
                    </p>
                  </div>
                  <StatusBadge state={t.pace.state} estimate={t.pace.isEstimate} />
                  <span className="tabular w-20 shrink-0 text-right text-footnote font-semibold">{relativeDays(model.today, t.track.exam_starts_on!)}</span>
                </Link>
              );
            })}
            {undated.map((t) => (
              <Link key={t.track.id} href={`/tracks/${t.track.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fill">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-subheadline font-semibold">{trackTitle(t.subject, t.track)}</p>
                  <p className="text-footnote text-label-2">{TRACK_KIND_LABEL[t.track.kind]} · termín zatím chybí</p>
                </div>
                <span className="text-footnote font-semibold text-accent-text">Doplnit</span>
                <Icon name="chevronRight" size={16} className="text-label-3" />
              </Link>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Administrativa" description="Přihlášky, seznam četby a další termíny mimo samotné zkoušky.">
        {openTasks.length === 0 ? (
          <EmptyState icon="doc" title="Žádné otevřené administrativní termíny" action={addTask}>
            Přidej třeba podání přihlášky k maturitě nebo odevzdání seznamu literatury. Ke každému termínu umí StudyDrive poslat
            připomínku.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-separator overflow-hidden">
            {openTasks.map((task) => (
              <TaskRow key={task.id} task={task} today={model.today} subjects={activeSubjects} />
            ))}
          </Card>
        )}
      </Section>

      {doneTasks.length > 0 && (
        <Section title="Hotovo">
          <Card className="divide-y divide-separator overflow-hidden">
            {doneTasks.map((task) => (
              <TaskRow key={task.id} task={task} today={model.today} subjects={activeSubjects} />
            ))}
          </Card>
        </Section>
      )}
    </>
  );
}

function TaskRow({ task, today, subjects }: { task: AdminTaskRow; today: string; subjects: SubjectRow[] }) {
  const done = !!task.completed_at;
  const days = task.due_on ? daysBetween(today, task.due_on) : null;
  const overdue = !done && days !== null && days < 0;
  const subject = subjects.find((s) => s.id === task.subject_id);
  return (
    <div className="flex items-center gap-2 px-2 py-2 sm:px-3">
      <ActionButton
        action={setTaskDone}
        fields={{ id: task.id, done: done ? "false" : "true" }}
        variant="plain"
        icon={done ? "checkCircle" : "circle"}
        ariaLabel={done ? `Označit „${task.title}“ jako nehotové` : `Označit „${task.title}“ jako hotové`}
        className={done ? "text-green" : "text-label-2"}
      />
      <div className="min-w-0 flex-1">
        <p className={cx("text-subheadline font-medium", done && "text-label-2 line-through")}>{task.title}</p>
        <p className={cx("text-footnote", overdue ? "font-semibold text-red" : "text-label-2")}>
          {task.due_on ? `do ${formatDate(task.due_on)} · ${relativeDays(today, task.due_on)}` : "bez termínu"}
          {subject && ` · ${subject.name}`}
          {!task.reminders_enabled && " · bez připomínky"}
        </p>
        {task.notes && <p className="mt-0.5 line-clamp-2 text-footnote text-label-2">{task.notes}</p>}
      </div>
      <SheetForm action={updateTask} title="Upravit termín" trigger="" triggerLabel={`Upravit ${task.title}`} triggerIcon="pencil" triggerVariant="plain" triggerSize="sm">
        <TaskFields task={task} subjects={subjects} />
      </SheetForm>
      <ActionButton
        action={deleteTask}
        fields={{ id: task.id }}
        variant="plain"
        size="sm"
        icon="trash"
        ariaLabel={`Smazat ${task.title}`}
        confirmText={`Smazat termín „${task.title}“?`}
        className="text-red"
      />
    </div>
  );
}
