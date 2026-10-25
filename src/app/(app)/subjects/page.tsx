import type { Metadata } from "next";
import Link from "next/link";
import { createSubject } from "../actions";
import { ArchiveButton, MoveButtons } from "@/components/entity-controls";
import { SubjectFields } from "@/components/fields";
import { SheetForm } from "@/components/forms";
import { Icon } from "@/components/icon";
import { Card, EmptyState, PageHeader, Pill, ProgressRing, Section, StatusBadge } from "@/components/ui";
import { loadModel } from "@/lib/data";
import { formatTopics } from "@/lib/domain/dates";

export const metadata: Metadata = { title: "Předměty" };

function AddSubject({ variant = "filled" }: { variant?: "filled" | "tinted" }) {
  return (
    <SheetForm
      action={createSubject}
      title="Nový předmět"
      description="Okruhy zkoušek (např. ústní a praktickou část) přidáš v detailu předmětu."
      trigger="Přidat předmět"
      triggerIcon="plus"
      triggerVariant={variant}
      submitLabel="Přidat"
    >
      <SubjectFields />
    </SheetForm>
  );
}

export default async function SubjectsPage() {
  const { data, model } = await loadModel();
  const archived = data.subjects.filter((s) => s.archived_at);

  return (
    <>
      <PageHeader title="Předměty" subtitle="Předmět → okruhy zkoušky → témata" actions={model.subjects.length > 0 && <AddSubject />} />

      {model.subjects.length === 0 ? (
        <EmptyState icon="subjects" title="Zatím žádné předměty" action={<AddSubject />}>
          Přidej maturitní předměty. U každého pak vytvoříš okruhy zkoušky — třeba didaktický test, písemnou práci, ústní nebo
          praktickou zkoušku — a k nim témata.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-separator overflow-hidden">
          {model.subjects.map((s, i) => (
            <div key={s.subject.id} className="flex items-center gap-2 pr-2">
              <Link href={`/subjects/${s.subject.id}`} className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3.5 hover:bg-fill">
                <ProgressRing ratio={s.progress.ratio} size={44} stroke={5} color={s.color} label={`Postup: ${s.subject.name}`}>
                  <span className="tabular text-[0.625rem] font-bold">
                    {s.progress.ratio === null ? "–" : Math.round(s.progress.ratio * 100)}
                  </span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-headline font-semibold">
                    {s.subject.name}
                    {s.subject.code && <Pill>{s.subject.code}</Pill>}
                  </p>
                  <p className="truncate text-footnote text-label-2">
                    {s.tracks.length === 0 ? "Bez okruhů zkoušek" : s.tracks.map((t) => t.track.name).join(" · ")}
                    {s.progress.topics > 0 && ` · ${formatTopics(s.progress.topics)}`}
                  </p>
                </div>
                {s.worstState && <span className="hidden sm:inline"><StatusBadge state={s.worstState} /></span>}
                <Icon name="chevronRight" size={16} className="text-label-3" />
              </Link>
              <MoveButtons entity="subject" id={s.subject.id} first={i === 0} last={i === model.subjects.length - 1} />
            </div>
          ))}
        </Card>
      )}

      {archived.length > 0 && (
        <Section title="Archiv" className="mt-8">
          <Card className="divide-y divide-separator">
            {archived.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/subjects/${s.id}`} className="min-w-0 flex-1 truncate text-subheadline text-label-2 hover:underline">
                  {s.name}
                </Link>
                <ArchiveButton entity="subject" id={s.id} archived />
              </div>
            ))}
          </Card>
        </Section>
      )}
    </>
  );
}
