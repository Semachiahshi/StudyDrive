import { deleteEntity, moveEntity, setArchived } from "@/app/(app)/actions";
import { ActionButton } from "./forms";

type Entity = "subject" | "track" | "topic";

export function MoveButtons({ entity, id, first, last }: { entity: Entity; id: string; first: boolean; last: boolean }) {
  return (
    <span className="inline-flex">
      {!first && (
        <ActionButton action={moveEntity} fields={{ entity, id, direction: "up" }} variant="plain" size="sm" icon="arrowUp" ariaLabel="Posunout výš" title="Posunout výš" />
      )}
      {!last && (
        <ActionButton action={moveEntity} fields={{ entity, id, direction: "down" }} variant="plain" size="sm" icon="arrowDown" ariaLabel="Posunout níž" title="Posunout níž" />
      )}
    </span>
  );
}

export function ArchiveButton({ entity, id, archived, label }: { entity: Entity; id: string; archived: boolean; label?: string }) {
  return (
    <ActionButton action={setArchived} fields={{ entity, id, archived: archived ? "false" : "true" }} variant="gray" size="sm" icon="archive">
      {label ?? (archived ? "Obnovit" : "Archivovat")}
    </ActionButton>
  );
}

export function DeleteButton({
  entity,
  id,
  confirmText,
  redirectTo,
}: {
  entity: Entity;
  id: string;
  confirmText: string;
  redirectTo?: string;
}) {
  return (
    <ActionButton action={deleteEntity} fields={{ entity, id, ...(redirectTo ? { redirect_to: redirectTo } : {}) }} variant="destructive" size="sm" icon="trash" confirmText={confirmText}>
      Smazat
    </ActionButton>
  );
}
