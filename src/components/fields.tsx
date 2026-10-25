import { Field, Input, Select, Textarea } from "./ui";

export const TRACK_KIND_LABEL = {
  didactic_test: "Didaktický test",
  essay: "Písemná práce",
  oral: "Ústní zkouška",
  practical: "Praktická zkouška",
  other: "Jiná část",
} as const;

export type TrackKind = keyof typeof TRACK_KIND_LABEL;

export function SubjectFields({ subject }: { subject?: { id: string; name: string; code: string | null; notes: string | null } }) {
  return (
    <>
      {subject && <input type="hidden" name="id" value={subject.id} />}
      <Field label="Název" htmlFor="subject-name">
        <Input id="subject-name" name="name" required maxLength={120} defaultValue={subject?.name} placeholder="Např. Český jazyk a literatura" />
      </Field>
      <Field label="Zkratka" htmlFor="subject-code" hint="Nepovinné. Zobrazuje se v přehledech.">
        <Input id="subject-code" name="code" maxLength={12} defaultValue={subject?.code ?? ""} placeholder="Např. ČJ" />
      </Field>
      <Field label="Poznámka" htmlFor="subject-notes">
        <Textarea id="subject-notes" name="notes" maxLength={5000} defaultValue={subject?.notes ?? ""} />
      </Field>
    </>
  );
}

export function TrackFields({
  subjectId,
  track,
}: {
  subjectId: string;
  track?: {
    id: string;
    name: string;
    kind: TrackKind;
    exam_starts_on: string | null;
    exam_ends_on: string | null;
    exam_date_status: "provisional" | "confirmed";
    notes: string | null;
  };
}) {
  return (
    <>
      <input type="hidden" name="subject_id" value={subjectId} />
      {track && <input type="hidden" name="id" value={track.id} />}
      <Field label="Název okruhu" htmlFor="track-name" hint="Každá část zkoušky má vlastní témata a postup — např. ústní a praktická zvlášť.">
        <Input id="track-name" name="name" required maxLength={120} defaultValue={track?.name} placeholder="Např. Ústní zkouška" />
      </Field>
      <Field label="Typ" htmlFor="track-kind">
        <Select id="track-kind" name="kind" defaultValue={track?.kind ?? "oral"}>
          {Object.entries(TRACK_KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <fieldset className="flex flex-col gap-3 rounded-xl bg-surface-2 p-3">
        <legend className="sr-only">Termín zkoušky</legend>
        <p className="px-1 text-footnote font-semibold text-label-2">Termín zkoušky (nepovinné)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Od / dne" htmlFor="track-start">
            <Input id="track-start" name="exam_starts_on" type="date" defaultValue={track?.exam_starts_on ?? ""} />
          </Field>
          <Field label="Do (u okna)" htmlFor="track-end">
            <Input id="track-end" name="exam_ends_on" type="date" defaultValue={track?.exam_ends_on ?? ""} />
          </Field>
        </div>
        <Field label="Jistota termínu" htmlFor="track-status" hint="U předběžného termínu nebo okna je tempo jen odhad.">
          <Select id="track-status" name="exam_date_status" defaultValue={track?.exam_date_status ?? "provisional"}>
            <option value="provisional">Předběžný / zatím jen okno</option>
            <option value="confirmed">Potvrzený</option>
          </Select>
        </Field>
      </fieldset>
      <Field label="Poznámka" htmlFor="track-notes">
        <Textarea id="track-notes" name="notes" maxLength={5000} defaultValue={track?.notes ?? ""} />
      </Field>
    </>
  );
}

export type AssignmentOptions = {
  subjects: { id: string; name: string }[];
  tracks: { id: string; name: string; subject_id: string }[];
  topics: { id: string; title: string; track_id: string }[];
};

/** Optional subject / exam track / topic assignment for files and notes. */
export function AssignmentFields({
  options,
  value,
  idPrefix,
}: {
  options: AssignmentOptions;
  value?: { subject_id: string | null; track_id: string | null; topic_id: string | null };
  idPrefix: string;
}) {
  const subjectName = new Map(options.subjects.map((s) => [s.id, s.name]));
  const trackName = new Map(options.tracks.map((t) => [t.id, `${subjectName.get(t.subject_id) ?? ""} · ${t.name}`]));
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Předmět" htmlFor={`${idPrefix}-subject`}>
        <Select id={`${idPrefix}-subject`} name="subject_id" defaultValue={value?.subject_id ?? ""}>
          <option value="">—</option>
          {options.subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Okruh" htmlFor={`${idPrefix}-track`}>
        <Select id={`${idPrefix}-track`} name="track_id" defaultValue={value?.track_id ?? ""}>
          <option value="">—</option>
          {options.tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {trackName.get(t.id)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Téma" htmlFor={`${idPrefix}-topic`}>
        <Select id={`${idPrefix}-topic`} name="topic_id" defaultValue={value?.topic_id ?? ""}>
          <option value="">—</option>
          {options.topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
