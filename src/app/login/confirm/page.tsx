import type { Metadata } from "next";
import { Suspense } from "react";
import { AppMark } from "@/components/app-mark";
import { buttonClass, ButtonLink, cx } from "@/components/ui";

export const metadata: Metadata = { title: "Přihlášení" };

const COPY: Record<string, { title: string; button: string }> = {
  invite: { title: "Potvrdit účet", button: "Potvrdit a přihlásit se" },
};
const DEFAULT_COPY = { title: "Přihlášení do StudyDrive", button: "Přihlásit se" };

// A plain form (no JavaScript needed): the POST to /auth/confirm is what
// spends the one-time token, so link scanners that only GET this page cannot.
async function ConfirmForm({ searchParams }: { searchParams: PageProps<"/login/confirm">["searchParams"] }) {
  const { token_hash: tokenHash, type } = await searchParams;
  if (typeof tokenHash !== "string" || typeof type !== "string") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-subheadline text-label-2">Odkaz z e-mailu je neúplný. Požádej o nový kód.</p>
        <ButtonLink href="/login" className="w-full">
          Zpět na přihlášení
        </ButtonLink>
      </div>
    );
  }

  const copy = COPY[type] ?? DEFAULT_COPY;
  return (
    <form method="post" action="/auth/confirm" className="flex flex-col gap-4">
      <h2 className="text-headline font-semibold">{copy.title}</h2>
      <p className="text-subheadline text-label-2">Pokračuj tlačítkem. Odkaz jde použít jen jednou.</p>
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <button type="submit" className={cx(buttonClass("filled"), "w-full")}>
        {copy.button}
      </button>
    </form>
  );
}

export default function ConfirmPage({ searchParams }: PageProps<"/login/confirm">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <AppMark size={64} />
          <h1 className="mt-4 text-title-1 font-bold">StudyDrive</h1>
        </div>
        <div className="rounded-card bg-surface p-5 shadow-card sm:p-6">
          <Suspense fallback={<div className="h-36" />}>
            <ConfirmForm searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
