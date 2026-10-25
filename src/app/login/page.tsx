import type { Metadata } from "next";
import { Suspense } from "react";
import { AppMark } from "@/components/app-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Přihlášení" };

const ERRORS: Record<string, string> = {
  "not-allowed": "Tento účet nemá do StudyDrive přístup.",
  "link-invalid": "Odkaz z e-mailu je neplatný nebo vypršel. Požádej o nový kód.",
};

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  return <LoginForm initialError={typeof error === "string" ? ERRORS[error] : undefined} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <AppMark size={64} />
          <h1 className="mt-4 text-title-1 font-bold">StudyDrive</h1>
          <p className="mt-1 text-subheadline text-label-2">Soukromá cesta k maturitě</p>
        </div>
        <div className="rounded-card bg-surface p-5 shadow-card sm:p-6">
          <Suspense fallback={<div className="h-36" />}>
            <Form searchParams={searchParams} />
          </Suspense>
        </div>
        <p className="mt-6 px-4 text-center text-caption text-label-2">
          Přístup má jen pozvaný účet. Registrace není veřejná.
        </p>
      </div>
    </main>
  );
}
