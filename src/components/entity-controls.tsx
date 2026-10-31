import { deleteEntity, moveEntity, setArchived } from "@/app/(app)/actions";
import { ActionButton } from "./forms";
import { Icon } from "./icon";
import { buttonClass } from "./ui";

type Entity = "subject" | "track" | "topic";

export function MoveButtons({ entity, id, first, last }: { entity: Entity; id: string; first: boolean; last: boolean }) {
  return (
    // A missing arrow keeps its slot, so the arrows line up from row to row.
    <span className="inline-flex shrink-0">
      {first ? (
        <Placeholder />
      ) : (
        <ActionButton action={moveEntity} fields={{ entity, id, direction: "up" }} variant="plain" size="sm" icon="arrowUp" ariaLabel="Posunout výš" title="Posunout výš" />
      )}
      {last ? (
        <Placeholder />
      ) : (
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

function Placeholder() {
  return (
    <span aria-hidden className={`${buttonClass("plain", "sm")} invisible`}>
      <Icon name="arrowUp" size={16} />
    </span>
  );
}
