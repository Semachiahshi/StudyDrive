"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/forms";
import { FormError, Input } from "@/components/ui";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, { step: "email", error: initialError });

  if (state.step === "email") {
    return (
      <form action={action} className="flex flex-col gap-4" key="email">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="px-1 text-footnote font-semibold text-label-2">
            E-mail
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required autoFocus placeholder="jmeno@example.cz" />
        </div>
        <FormError message={state.error} />
        <SubmitButton className="w-full">Poslat přihlašovací kód</SubmitButton>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" key="code">
      {state.notice && <p className="text-subheadline text-label-2">{state.notice}</p>}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="code" className="px-1 text-footnote font-semibold text-label-2">
          Kód z e-mailu
        </label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,12}"
          maxLength={12}
          required
          autoFocus
          placeholder="123456"
          className="tabular text-center text-title-2 tracking-[0.3em]"
        />
        <p className="px-1 text-caption text-label-2">
          Odesláno na {state.email}. Pokud e-mail obsahuje jen odkaz, klikni na něj v tomto prohlížeči.
        </p>
      </div>
      <FormError message={state.error} />
      <SubmitButton className="w-full">Přihlásit se</SubmitButton>
      <button
        type="submit"
        name="intent"
        value="back"
        formNoValidate
        className="touch-target text-subheadline text-accent-text"
      >
        Použít jiný e-mail
      </button>
    </form>
  );
}
