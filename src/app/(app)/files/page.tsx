import type { Metadata } from "next";
import { createNote, deleteFile, deleteNote, updateFile, updateNote } from "../actions";
import { AssignmentFields, type AssignmentOptions } from "@/components/fields";
import { FileUpload } from "@/components/file-upload";
import { ActionButton, SheetForm } from "@/components/forms";
import { Icon } from "@/components/icon";
import { Card, EmptyState, Field, Input, PageHeader, Section, Textarea } from "@/components/ui";
import { loadFilesAndNotes, loadStudyData, type FileRow, type NoteRow } from "@/lib/data";

export const metadata: Metadata = { title: "Soubory" };

const sizeFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} kB`;
  return `${sizeFormatter.format(bytes / 1024 / 1024)} MB`;
}
const dateTime = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Prague" });

export default async function FilesPage() {
  const [{ userId, files, notes }, data] = await Promise.all([loadFilesAndNotes(), loadStudyData()]);
  const options: AssignmentOptions = {
    subjects: data.subjects.filter((s) => !s.archived_at),
    tracks: data.tracks.filter((t) => !t.archived_at),
    topics: data.topics.filter((t) => !t.archived_at),
  };
  const label = assignmentLabel(data);

  return (
    <>
      <PageHeader title="Soubory" subtitle="Tvoje vlastní podklady a poznámky — soukromé, jen pro tebe." />

      <Section title="Nahrát">
        <Card>
          <FileUpload userId={userId} options={options} />
        </Card>
      </Section>

      <Section title="Soubory" description="Soubory se jen ukládají — StudyDrive je nečte ani z nich nic nevytahuje.">
        {files.length === 0 ? (
          <EmptyState icon="files" title="Zatím žádné soubory" compact>
            Nahraj vlastní výpisky, zadání nebo fotky sešitu a přiřaď je k předmětu, okruhu nebo tématu.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-separator overflow-hidden">
            {files.map((f) => (
              <FileRowView key={f.id} file={f} options={options} where={label(f)} />
            ))}
          </Card>
        )}
      </Section>

      <Section
        title="Poznámky"
        action={
          <SheetForm action={createNote} title="Nová poznámka" trigger="Nová poznámka" triggerIcon="plus" triggerSize="sm" submitLabel="Uložit">
            <NoteFields options={options} />
          </SheetForm>
        }
      >
        {notes.length === 0 ? (
          <EmptyState icon="note" title="Zatím žádné poznámky" compact>
            Krátké poznámky k předmětu, okruhu nebo tématu — co si zopakovat, na co se zeptat, co nezapomenout.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} options={options} where={label(n)} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function assignmentLabel(data: Awaited<ReturnType<typeof loadStudyData>>) {
  const subjects = new Map(data.subjects.map((s) => [s.id, s.code || s.name]));
  const tracks = new Map(data.tracks.map((t) => [t.id, t.name]));
  const topics = new Map(data.topics.map((t) => [t.id, t.title]));
  return (item: { subject_id: string | null; track_id: string | null; topic_id: string | null }) =>
    [
      item.subject_id && subjects.get(item.subject_id),
      item.track_id && tracks.get(item.track_id),
      item.topic_id && topics.get(item.topic_id),
    ]
      .filter(Boolean)
      .join(" · ");
}

function FileRowView({ file, options, where }: { file: FileRow; options: AssignmentOptions; where: string }) {
  return (
    <div className="flex items-center gap-2 py-2 pl-4 pr-2">
      <Icon name="doc" size={22} className="shrink-0 text-accent-text" />
      <a href={`/files/${file.id}/download`} target="_blank" rel="noopener" className="min-w-0 flex-1 py-1 hover:underline">
        <span className="block truncate text-subheadline font-medium">{file.display_name}</span>
        <span className="block truncate text-footnote text-label-2">
          {formatSize(file.size_bytes)} · {dateTime.format(new Date(file.created_at))}
          {where && ` · ${where}`}
        </span>
      </a>
      <a href={`/files/${file.id}/download?download=1`} className="touch-target grid size-8 place-items-center rounded-full text-accent-text hover:bg-fill" aria-label={`Stáhnout ${file.display_name}`}>
        <Icon name="download" size={17} />
      </a>
      <SheetForm action={updateFile} title="Upravit soubor" trigger="" triggerLabel={`Upravit ${file.display_name}`} triggerIcon="pencil" triggerVariant="plain" triggerSize="sm">
        <input type="hidden" name="id" value={file.id} />
        <Field label="Název" htmlFor={`file-name-${file.id}`}>
          <Input id={`file-name-${file.id}`} name="display_name" required maxLength={200} defaultValue={file.display_name} />
        </Field>
        <AssignmentFields options={options} value={file} idPrefix={`file-${file.id}`} />
      </SheetForm>
      <ActionButton
        action={deleteFile}
        fields={{ id: file.id }}
        variant="plain"
        size="sm"
        icon="trash"
        className="text-red"
        ariaLabel={`Smazat ${file.display_name}`}
        confirmText={`Smazat soubor „${file.display_name}“? Tuto akci nejde vrátit.`}
      />
    </div>
  );
}

function NoteFields({ note, options }: { note?: NoteRow; options: AssignmentOptions }) {
  const p = note?.id ?? "new";
  return (
    <>
      {note && <input type="hidden" name="id" value={note.id} />}
      <Field label="Název" htmlFor={`note-title-${p}`}>
        <Input id={`note-title-${p}`} name="title" required maxLength={200} defaultValue={note?.title} />
      </Field>
      <Field label="Text" htmlFor={`note-body-${p}`}>
        <Textarea id={`note-body-${p}`} name="body" rows={8} maxLength={50000} defaultValue={note?.body} />
      </Field>
      <AssignmentFields options={options} value={note} idPrefix={`note-${p}`} />
    </>
  );
}

function NoteCard({ note, options, where }: { note: NoteRow; options: AssignmentOptions; where: string }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-headline font-semibold">{note.title}</h3>
          <p className="text-caption text-label-2">
            {dateTime.format(new Date(note.updated_at))}
            {where && ` · ${where}`}
          </p>
        </div>
        <SheetForm action={updateNote} title="Upravit poznámku" trigger="" triggerLabel={`Upravit ${note.title}`} triggerIcon="pencil" triggerVariant="plain" triggerSize="sm">
          <NoteFields note={note} options={options} />
        </SheetForm>
        <ActionButton
          action={deleteNote}
          fields={{ id: note.id }}
          variant="plain"
          size="sm"
          icon="trash"
          className="text-red"
          ariaLabel={`Smazat ${note.title}`}
          confirmText={`Smazat poznámku „${note.title}“?`}
        />
      </div>
      {note.body && <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-subheadline text-label-2">{note.body}</p>}
    </Card>
  );
}
