import type { Metadata } from "next";
import { createTopics, updateTrack } from "../../actions";
import { paceText } from "@/components/dashboard/pace-copy";
import { ArchiveButton, DeleteButton } from "@/components/entity-controls";
import { TRACK_KIND_LABEL, TrackFields } from "@/components/fields";
import { SheetForm } from "@/components/forms";
import { Icon } from "@/components/icon";
import { TopicRow } from "@/components/topic-row";
import { Card, EmptyState, Field, PageHeader, ProgressRing, Section, StatusBadge, Textarea } from "@/components/ui";
import { loadModel, requireItem } from "@/lib/data";
import { formatDate, formatDateWindow, formatDays, formatSteps, relativeDays } from "@/lib/domain/dates";
import type { Pace } from "@/lib/domain/pace";
import { percent } from "@/lib/domain/progress";
import { STEPS, STEP_NOUN, isStepDone } from "@/lib/domain/steps";

export const metadata: Metadata = { title: "Okruh zkoušky" };

export default async function TrackPage({ params }: PageProps<"/tracks/[trackId]">) {
  const { trackId } = await params;
  const { data, model } = await loadModel();
  const track = requireItem(data.tracks, (t) => t.id === trackId);
  const subject = requireItem(data.subjects, (s) => s.id === track.subject_id);
  const subjectView = model.subjects.find((s) => s.subject.id === subject.id);
  const view = subjectView?.tracks.find((t) => t.track.id === trackId);
  const topics = view?.topics ?? data.topics.filter((t) => t.track_id === trackId && !t.archived_at);
  const archivedTopics = data.topics.filter((t) => t.track_id === trackId && t.archived_at);

  const addTopics = (
    <SheetForm
      action={createTopics}
      title="Přidat témata"
      description="Každý řádek = jedno téma. Pořadí zůstane zachované."
      trigger="Přidat témata"
      triggerIcon="plus"
      triggerVariant="filled"
      submitLabel="Přidat"
    >
      <input type="hidden" name="track_id" value={track.id} />
      <Field label="Témata" htmlFor="topic-titles">
        <Textarea id="topic-titles" name="titles" required rows={8} placeholder={"První téma\nDruhé téma"} />
      </Field>
    </SheetForm>
  );

  return (
    <>
      <PageHeader
        back={{ href: `/subjects/${subject.id}`, label: subject.name }}
        title={track.name}
        subtitle={`${subject.name} · ${TRACK_KIND_LABEL[track.kind]}${track.archived_at ? " · archivováno" : ""}`}
        actions={
          <>
            {topics.length > 0 && !track.archived_at && addTopics}
            <SheetForm action={updateTrack} title="Upravit okruh" trigger="Upravit" triggerIcon="pencil" triggerVariant="gray">
              <TrackFields subjectId={subject.id} track={track} />
            </SheetForm>
          </>
        }
      />

      {view && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col p-5">
            <p className="text-footnote font-semibold text-label-2">Termín zkoušky</p>
            {track.exam_starts_on ? (
              <>
                <p className="mt-2 text-title-3 font-semibold">{formatDateWindow(track.exam_starts_on, track.exam_ends_on)}</p>
                <p className="text-footnote text-label-2">
                  {relativeDays(model.today, track.exam_starts_on)} ·{" "}
                  {track.exam_date_status === "confirmed" ? "potvrzený termín" : "předběžný termín"}
                  {track.exam_ends_on && track.exam_ends_on !== track.exam_starts_on ? " · okno" : ""}
                </p>
                {view.pace.targetDate && (
                  <p className="mt-auto flex items-center gap-1.5 pt-3 text-footnote">
                    <Icon name="flag" size={15} className="text-green" />
                    Cíl přípravy: {formatDate(view.pace.targetDate)} ({relativeDays(model.today, view.pace.targetDate)})
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-footnote text-label-2">
                Zatím bez termínu. Doplň ho přes <strong>Upravit</strong> — stačí i předběžné okno.
              </p>
            )}
          </Card>

          <Card className="flex items-center gap-4 p-5">
            <ProgressRing ratio={view.progress.ratio} size={96} stroke={10} color={subjectView?.color} label={`Postup: ${track.name}`}>
              <span className="tabular text-title-3 font-bold">{percent(view.progress.ratio)}</span>
            </ProgressRing>
            <ul className="min-w-0 space-y-1 text-footnote">
              {STEPS.map((step) => (
                <li key={step} className="tabular flex justify-between gap-3">
                  <span className="text-label-2">{STEP_NOUN[step]}</span>
                  <strong>
                    {topics.filter((t) => isStepDone(t, step)).length}/{topics.length}
                  </strong>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-footnote font-semibold text-label-2">Tempo</p>
              <StatusBadge state={view.pace.state} estimate={view.pace.isEstimate} />
            </div>
            <PaceDetail pace={view.pace} totalSteps={view.progress.totalSteps} doneSteps={view.progress.doneSteps} />
          </Card>
        </div>
      )}

      {track.notes && <Card className="mb-6 whitespace-pre-wrap p-4 text-subheadline text-label-2">{track.notes}</Card>}

      <Section title="Témata" description="Naučit → Procvičit → Zopakovat. Téma je hotové až po všech třech krocích.">
        {topics.length === 0 ? (
          <EmptyState icon="note" title="Zatím žádná témata" action={!track.archived_at && addTopics}>
            Přidej témata tohoto okruhu. Postup a tempo se začnou počítat, jakmile tu nějaká budou.
          </EmptyState>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-separator">
              {topics.map((topic, i) => (
                <TopicRow key={topic.id} topic={topic} index={i} count={topics.length} />
              ))}
            </ul>
          </Card>
        )}
      </Section>

      {archivedTopics.length > 0 && (
        <Section title="Archivovaná témata" description="Nezapočítávají se do postupu ani tempa.">
          <Card className="divide-y divide-separator">
            {archivedTopics.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1 truncate text-subheadline text-label-2">{t.title}</span>
                <ArchiveButton entity="topic" id={t.id} archived />
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Správa">
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-footnote text-label-2">
            <Icon name="info" size={16} className="shrink-0" />
            Archivace okruh skryje z přehledu. Smazání odstraní i jeho témata.
          </p>
          <ArchiveButton entity="track" id={track.id} archived={!!track.archived_at} />
          <DeleteButton
            entity="track"
            id={track.id}
            redirectTo={`/subjects/${subject.id}`}
            confirmText={`Opravdu smazat okruh „${track.name}“ včetně všech témat? Tuto akci nejde vrátit.`}
          />
        </Card>
      </Section>
    </>
  );
}

function PaceDetail({
  pace,
  totalSteps,
  doneSteps,
}: {
  pace: Pace;
  totalSteps: number;
  doneSteps: number;
}) {
  if (pace.state === "no_topics") return <p className="mt-2 text-footnote text-label-2">Tempo se spočítá, až budou témata.</p>;
  if (pace.state === "no_date") return <p className="mt-2 text-footnote text-label-2">Pro výpočet tempa chybí datum zkoušky.</p>;
  if (pace.state === "done") return <p className="mt-2 text-footnote text-label-2">Všechny kroky jsou hotové.</p>;
  if (pace.state === "exam_passed") return <p className="mt-2 text-footnote text-label-2">Zkouška už proběhla.</p>;

  const text = paceText(pace.perStudyDay, pace.perWeek);
  return (
    <dl className="mt-2 space-y-1 text-footnote">
      <div className="tabular flex justify-between gap-3">
        <dt className="text-label-2">Zbývá</dt>
        <dd className="font-semibold">{formatSteps(pace.remainingSteps)}</dd>
      </div>
      <div className="tabular flex justify-between gap-3">
        <dt className="text-label-2">Do cíle přípravy</dt>
        <dd className="font-semibold">{(pace.daysToTarget ?? 0) > 0 ? formatDays(pace.daysToTarget ?? 0) : "cíl minul"}</dd>
      </div>
      {pace.expectedDoneSteps !== null && (
        <div className="tabular flex justify-between gap-3">
          <dt className="text-label-2">Podle plánu / hotovo</dt>
          <dd className="font-semibold">
            {Math.floor(pace.expectedDoneSteps)} / {doneSteps} z {totalSteps}
          </dd>
        </div>
      )}
      {text && <p className="pt-1 text-label-2">Potřeba: {text}.</p>}
      {pace.isEstimate && (
        <p className="pt-1 text-label-2">
          Odhad — {pace.estimateReasons.includes("provisional_date") ? "termín je předběžný" : "známe jen okno zkoušek"}.
        </p>
      )}
    </dl>
  );
}
