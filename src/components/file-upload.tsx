"use client";

import { useRef, useState } from "react";
import { registerFile } from "@/app/(app)/actions";
import { AssignmentFields, type AssignmentOptions } from "./fields";
import { Icon } from "./icon";
import { buttonClass, cx, FormError } from "./ui";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 50 * 1024 * 1024;

function safeName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
  return cleaned || "soubor";
}

type Status = { name: string; state: "uploading" | "done" | "error"; message?: string };

/** Uploads directly to the private bucket under "<userId>/…", then registers metadata. Nothing is parsed. */
export function FileUpload({ userId, options }: { userId: string; options: AssignmentOptions }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) {
      setError("Vyber aspoň jeden soubor.");
      return;
    }
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const assignment = {
      subject_id: (form.get("subject_id") as string) || null,
      track_id: (form.get("track_id") as string) || null,
      topic_id: (form.get("topic_id") as string) || null,
    };
    setStatuses(files.map((f) => ({ name: f.name, state: "uploading" })));

    const update = (i: number, s: Partial<Status>) =>
      setStatuses((prev) => prev.map((p, j) => (j === i ? { ...p, ...s } : p)));

    for (const [i, file] of files.entries()) {
      if (file.size > MAX_BYTES) {
        update(i, { state: "error", message: "Soubor je větší než 50 MB." });
        continue;
      }
      const path = `${userId}/${crypto.randomUUID()}/${safeName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("study-files")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (uploadError) {
        update(i, { state: "error", message: "Nahrání se nepovedlo." });
        continue;
      }
      const result = await registerFile({
        storage_path: path,
        display_name: file.name.slice(0, 200),
        mime_type: file.type || null,
        size_bytes: file.size,
        ...assignment,
      });
      update(i, result?.ok ? { state: "done" } : { state: "error", message: result && !result.ok ? result.error : undefined });
    }

    setBusy(false);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4 p-4 sm:p-5">
      <label
        className={cx(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-separator px-4 py-6 text-center transition-colors hover:bg-fill",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <Icon name="upload" size={26} className="text-accent-text" />
        <span className="text-subheadline font-semibold">Vyber soubory</span>
        <span className="text-footnote text-label-2">PDF, obrázky, dokumenty — do 50 MB. Soubory zůstávají soukromé.</span>
        <input name="files" type="file" multiple className="sr-only" onChange={() => setStatuses([])} />
      </label>
      <AssignmentFields options={options} idPrefix="upload" />
      <FormError message={error} />
      {statuses.length > 0 && (
        <ul className="space-y-1 text-footnote" aria-live="polite">
          {statuses.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <Icon
                name={s.state === "done" ? "checkCircle" : s.state === "error" ? "warning" : "clock"}
                size={15}
                className={s.state === "done" ? "text-green" : s.state === "error" ? "text-red" : "text-label-2"}
              />
              <span className="truncate">{s.name}</span>
              <span className="text-label-2">
                {s.state === "uploading" ? "nahrávám…" : s.state === "done" ? "hotovo" : (s.message ?? "chyba")}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div>
        <button type="submit" disabled={busy} className={buttonClass("filled")}>
          {busy ? "Nahrávám…" : "Nahrát"}
        </button>
      </div>
    </form>
  );
}
