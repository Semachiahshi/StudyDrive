import type { Metadata } from "next";
import Link from "next/link";
import { createTrack, updateSubject } from "../../actions";
import { ArchiveButton, DeleteButton, MoveButtons } from "@/components/entity-controls";
import { SubjectFields, TRACK_KIND_LABEL, TrackFields } from "@/components/fields";
import { SheetForm } from "@/components/forms";
import { Icon } from "@/components/icon";
import { Card, EmptyState, PageHeader, Pill, ProgressBar, Section, StatusBadge } from "@/components/ui";
import { loadModel, requireItem } from "@/lib/data";
import { formatDateWindow, formatSteps, formatTopics, relativeDays } from "@/lib/domain/dates";
import { percent } from "@/lib/domain/progress";

export const metadata: Metadata = { title: "Předmět" };

export default async function SubjectPage({ params }: PageProps<"/subjects/[subjectId]">) {
  const { subjectId } = await params;
  const { data, model } = await loadModel();
  const subject = requireItem(data.subjects, (s) => s.id === subjectId);
  const view = model.subjects.find((s) => s.subject.id === subjectId);
  const archivedTracks = data.tracks.filter((t) => t.subject_id === subjectId && t.archived_at);

  const addTrack = (
    <SheetForm action={createTrack} title={`Nový okruh: ${subject.name}`} trigger="Přidat okruh" triggerIcon="plus" triggerVariant="filled" submitLabel="Přidat">
      <TrackFields subjectId={subject.id} />
    </SheetForm>
  );

  return (
    <>
      <PageHeader
        back={{ href: "/subjects", label: "Předměty" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {subject.name}
            {subject.code && <Pill className="text-footnote">{subject.code}</Pill>}
          </span>
        }
        subtitle={
          subject.archived_at
            ? "Archivovaný předmět — nezapočítává se do přehledu."
            : view && view.progress.topics > 0
              ? `${percent(view.progress.ratio)} hotovo · ${formatTopics(view.progress.topics)} · zbývá ${formatSteps(view.progress.remainingSteps)}`
              : undefined
        }
        actions={
          <>
            {!subject.archived_at && view && view.tracks.length > 0 && addTrack}
            <SheetForm action={updateSubject} title="Upravit předmět" trigger="Upravit" triggerIcon="pencil" triggerVariant="gray">
              <SubjectFields subject={subject} />
            </SheetForm>
          </>
        }
      />

      {subject.notes && <Card className="mb-6 whitespace-pre-wrap p-4 text-subheadline text-label-2">{subject.notes}</Card>}

      {!subject.archived_at && (
        <Section title="Okruhy zkoušky" description="Každý okruh má vlastní témata, termín a postup.">
          {!view || view.tracks.length === 0 ? (
            <EmptyState icon="flag" title="Zatím žádné okruhy" action={addTrack}>
              Okruh je samostatná část zkoušky: např. didaktický test, písemná práce, ústní nebo praktická zkouška. Stejný předmět
              může mít víc okruhů s vlastními tématy.
            </EmptyState>
          ) : (
            <Card className="divide-y divide-separator overflow-hidden">
              {view.tracks.map((t, i) => (
                <div key={t.track.id} className="flex items-center gap-2 pr-2">
                  <Link href={`/tracks/${t.track.id}`} className="flex min-w-0 flex-1 flex-col gap-2 px-4 py-3.5 hover:bg-fill">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-headline font-semibold">{t.track.name}</span>
                        <span className="block text-footnote text-label-2">
                          {TRACK_KIND_LABEL[t.track.kind]}
                          {t.track.exam_starts_on
                            ? ` · ${formatDateWindow(t.track.exam_starts_on, t.track.exam_ends_on)} (${relativeDays(model.today, t.track.exam_starts_on)})`
                            : " · bez termínu"}
                        </span>
                      </span>
                      <StatusBadge state={t.pace.state} estimate={t.pace.isEstimate} />
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressBar ratio={t.progress.ratio} color={view.color} label={`Postup: ${t.track.name}`} />
                      <span className="tabular w-24 shrink-0 text-right text-caption text-label-2">
                        {t.progress.topics > 0 ? `${t.progress.doneSteps}/${t.progress.totalSteps} kroků` : "bez témat"}
                      </span>
                    </div>
                  </Link>
                  <MoveButtons entity="track" id={t.track.id} first={i === 0} last={i === view.tracks.length - 1} />
                </div>
              ))}
            </Card>
          )}
        </Section>
      )}

      {archivedTracks.length > 0 && (
        <Section title="Archivované okruhy">
          <Card className="divide-y divide-separator">
            {archivedTracks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/tracks/${t.id}`} className="min-w-0 flex-1 truncate text-subheadline text-label-2 hover:underline">
                  {t.name}
                </Link>
                <ArchiveButton entity="track" id={t.id} archived />
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Správa">
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <p className="flex min-w-0 flex-1 items-center gap-2 text-footnote text-label-2">
            <Icon name="info" size={16} className="shrink-0" />
            Archivace předmět skryje, ale nic nesmaže. Smazání odstraní i jeho okruhy a témata.
          </p>
          <ArchiveButton entity="subject" id={subject.id} archived={!!subject.archived_at} />
          <DeleteButton
            entity="subject"
            id={subject.id}
            redirectTo="/subjects"
            confirmText={`Opravdu smazat předmět „${subject.name}“ včetně všech okruhů a témat? Tuto akci nejde vrátit.`}
          />
        </Card>
      </Section>
    </>
  );
}
