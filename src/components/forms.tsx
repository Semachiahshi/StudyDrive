"use client";

import { useActionState, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Icon, type IconName } from "./icon";
import { buttonClass, cx, FormError } from "./ui";
import type { ActionState, FormAction } from "@/lib/action-state";

function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

export function SubmitButton({
  children,
  variant = "filled",
  className,
}: {
  children: ReactNode;
  variant?: "filled" | "destructive" | "tinted" | "gray";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cx(buttonClass(variant), className)}>
      {pending && <Spinner />}
      {children}
    </button>
  );
}

/**
 * A button that opens a sheet (native <dialog>) holding a form bound to a
 * server action. Closes and resets on success; shows the error otherwise.
 */
export function SheetForm({
  action,
  title,
  description,
  trigger,
  triggerIcon,
  triggerVariant = "tinted",
  triggerSize = "md",
  triggerLabel,
  submitLabel = "Uložit",
  submitVariant = "filled",
  children,
}: {
  action: FormAction;
  title: string;
  description?: ReactNode;
  trigger: ReactNode;
  triggerIcon?: IconName;
  triggerVariant?: "filled" | "tinted" | "plain" | "gray" | "destructive";
  triggerSize?: "md" | "sm";
  /** Accessible label when the trigger is icon-only. */
  triggerLabel?: string;
  submitLabel?: string;
  submitVariant?: "filled" | "destructive";
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [openedAt, setOpenedAt] = useState(0);
  const titleId = useId();
  const [state, formAction] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await action(prev, fd);
    if (result?.ok) {
      formRef.current?.reset();
      dialogRef.current?.close();
    }
    // Re-stamp with the client clock so it compares correctly with openedAt.
    return result && { ...result, at: Date.now() };
  }, null);

  // Only show an error produced since the sheet was last opened.
  const showError = state && !state.ok && state.at > openedAt ? state.error : null;

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        className={buttonClass(triggerVariant, triggerSize)}
        onClick={() => {
          setOpenedAt(Date.now());
          dialogRef.current?.showModal();
        }}
      >
        {triggerIcon && <Icon name={triggerIcon} size={triggerSize === "md" ? 18 : 16} />}
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto max-h-[90dvh] w-[min(34rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[1.375rem] bg-surface p-0 text-label shadow-2xl"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <form ref={formRef} action={formAction} className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-title-3 font-semibold">
                {title}
              </h2>
              {description && <div className="mt-1 text-subheadline text-label-2">{description}</div>}
            </div>
            <button
              type="button"
              aria-label="Zavřít"
              className="touch-target -mr-2 -mt-1 grid size-9 place-items-center rounded-full bg-fill text-label-2 hover:bg-fill-strong"
              onClick={() => dialogRef.current?.close()}
            >
              <Icon name="close" size={16} strokeWidth={2.2} />
            </button>
          </div>
          {children}
          <FormError message={showError} />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={buttonClass("gray")} onClick={() => dialogRef.current?.close()}>
              Zrušit
            </button>
            <SubmitButton variant={submitVariant}>{submitLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** A small form posting hidden values to a server action, with pending and error feedback. */
export function ActionButton({
  action,
  fields,
  children,
  variant = "tinted",
  size = "md",
  icon,
  className,
  confirmText,
  ariaLabel,
  title,
}: {
  action: FormAction;
  fields?: Record<string, string>;
  children?: ReactNode;
  variant?: "filled" | "tinted" | "plain" | "gray" | "destructive" | "success";
  size?: "md" | "sm";
  icon?: IconName;
  className?: string;
  confirmText?: string;
  ariaLabel?: string;
  title?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  return (
    <form
      action={formAction}
      className="inline-flex flex-col items-start gap-1"
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(fields ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" disabled={pending} aria-label={ariaLabel} title={title} className={cx(buttonClass(variant, size), className)}>
        {pending ? <Spinner /> : icon && <Icon name={icon} size={size === "md" ? 18 : 16} />}
        {children}
      </button>
      {state && !state.ok && (
        <span role="alert" className="text-caption text-red">
          {state.error}
        </span>
      )}
    </form>
  );
}

/** An always-visible form (e.g. Settings) with inline "saved" / error feedback. */
export function InlineForm({
  action,
  children,
  submitLabel = "Uložit",
  className,
}: {
  action: FormAction;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      <div className="flex flex-wrap items-center gap-3 px-4 pb-4 pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        {state?.ok && (
          <span role="status" className="inline-flex items-center gap-1 text-footnote text-green">
            <Icon name="check" size={15} strokeWidth={2.4} />
            Uloženo
          </span>
        )}
        {state && !state.ok && (
          <span role="alert" className="text-footnote text-red">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
