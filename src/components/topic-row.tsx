import { completeStep, reopenStep, startSession, updateTopic } from "@/app/(app)/actions";
import { ArchiveButton, DeleteButton, MoveButtons } from "./entity-controls";
import { ActionButton, SheetForm } from "./forms";
import { Icon } from "./icon";
import { Field, Input, Textarea, cx } from "./ui";
import { STEPS, STEP_LABEL, canComplete, canReopen, isStepDone, nextStep, type StepState } from "@/lib/domain/steps";

type Topic = StepState & { id: string; title: string; notes: string | null; archived_at: string | null };

const timeFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", timeZone: "Europe/Prague" });

/** One topic with its three ordered steps. Done steps can be reopened from the latest one back. */
export function TopicRow({ topic, index, count }: { topic: Topic; index: number; count: number }) {
  const next = nextStep(topic);
  const complete = next === null;

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cx(
            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-caption font-bold",
            complete ? "bg-green text-white" : "bg-fill text-label-2",
          )}
          aria-hidden
        >
          {complete ? <Icon name="check" size={14} strokeWidth={2.6} /> : index + 1}
        </span>
        <div className="min-w-0">
          <p className={cx("text-subheadline font-medium", complete && "text-label-2")}>{topic.title}</p>
          {topic.notes && <p className="mt-0.5 line-clamp-2 text-footnote text-label-2">{topic.notes}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pl-9 sm:pl-0" role="group" aria-label={`Kroky: ${topic.title}`}>
        {STEPS.map((step) => {
          const done = isStepDone(topic, step);
          const completedAt = topic[`${step}_completed_at`];
          if (done) {
            const reopenable = canReopen(topic, step);
            return reopenable ? (
              <ActionButton
                key={step}
                action={reopenStep}
                fields={{ topic_id: topic.id, step }}
                variant="success"
                size="sm"
                icon="check"
                title={`Hotovo ${completedAt ? timeFormatter.format(new Date(completedAt)) : ""} — klepnutím vrátíš, pokud šlo o omyl`}
                ariaLabel={`${STEP_LABEL[step]}: hotovo. Vrátit.`}
              >
                {STEP_LABEL[step]}
              </ActionButton>
            ) : (
              <span
                key={step}
                className="inline-flex min-h-8 items-center gap-1 rounded-full bg-green-tint px-3 text-footnote font-semibold text-green"
                title={completedAt ? `Hotovo ${timeFormatter.format(new Date(completedAt))}` : "Hotovo"}
              >
                <Icon name="check" size={14} strokeWidth={2.4} />
                {STEP_LABEL[step]}
                <span className="sr-only">: hotovo</span>
              </span>
            );
          }
          if (canComplete(topic, step)) {
            return (
              <ActionButton
                key={step}
                action={completeStep}
                fields={{ topic_id: topic.id, step }}
                variant="tinted"
                size="sm"
                icon="circle"
                ariaLabel={`Označit krok ${STEP_LABEL[step]} jako hotový`}
              >
                {STEP_LABEL[step]}
              </ActionButton>
            );
          }
          return (
            <span
              key={step}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-fill px-3 text-footnote text-label-2"
              title="Nejdřív dokonči předchozí krok"
            >
              <Icon name="circle" size={14} />
              {STEP_LABEL[step]}
            </span>
          );
        })}

        {next && (
          <ActionButton
            action={startSession}
            fields={{ topic_id: topic.id, step: next }}
            variant="plain"
            size="sm"
            icon="play"
            ariaLabel={`Začít: ${STEP_LABEL[next]} — ${topic.title}`}
            title="Začít studovat (počítá se do série)"
          />
        )}

        <SheetForm
          action={updateTopic}
          title="Upravit téma"
          trigger=""
          triggerLabel={`Upravit téma ${topic.title}`}
          triggerIcon="pencil"
          triggerVariant="plain"
          triggerSize="sm"
        >
          <input type="hidden" name="id" value={topic.id} />
          <Field label="Název" htmlFor={`topic-title-${topic.id}`}>
            <Input id={`topic-title-${topic.id}`} name="title" required maxLength={300} defaultValue={topic.title} />
          </Field>
          <Field label="Poznámka" htmlFor={`topic-notes-${topic.id}`}>
            <Textarea id={`topic-notes-${topic.id}`} name="notes" maxLength={10000} defaultValue={topic.notes ?? ""} />
          </Field>
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3">
            <span className="mr-auto text-footnote text-label-2">Pořadí a správa</span>
            <MoveButtons entity="topic" id={topic.id} first={index === 0} last={index === count - 1} />
            <ArchiveButton entity="topic" id={topic.id} archived={!!topic.archived_at} />
            <DeleteButton entity="topic" id={topic.id} confirmText={`Smazat téma „${topic.title}“? Postup u něj se ztratí.`} />
          </div>
        </SheetForm>
      </div>
    </li>
  );
}
