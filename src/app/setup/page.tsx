import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppMark } from "@/components/app-mark";
import { Icon } from "@/components/icon";
import { configurationStatus, supabasePublicEnv } from "@/lib/env";

export const metadata: Metadata = { title: "Nastavení připojení" };

async function Status() {
  await connection();
  // Once Supabase is connected, configuration details are shown only to the
  // signed-in owner (Settings), not on this public page.
  if (supabasePublicEnv()) redirect("/");
  const checks = configurationStatus();

  return (
    <ul className="divide-y divide-separator overflow-hidden rounded-card bg-surface shadow-card">
      {checks.map((c) => (
        <li key={c.name} className="flex items-start gap-3 px-4 py-3">
          <Icon
            name={c.ok ? "checkCircle" : "circle"}
            size={20}
            className={c.ok ? "mt-0.5 text-green" : "mt-0.5 text-label-3"}
            label={c.ok ? "Nastaveno" : "Chybí"}
          />
          <div className="min-w-0">
            <code className="text-footnote font-semibold">{c.name}</code>
            <p className="text-footnote text-label-2">{c.purpose}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 flex items-center gap-3">
        <AppMark size={44} />
        <div>
          <h1 className="text-title-1 font-bold">StudyDrive čeká na připojení</h1>
          <p className="text-subheadline text-label-2">Aplikace je hotová, chybí jen propojení se Supabase.</p>
        </div>
      </div>
      <p className="mb-4 text-subheadline text-label-2">
        Doplň proměnné prostředí (ve Vercelu nebo v souboru <code>.env.local</code>) podle <code>.env.example</code> a
        README. Hodnoty se tu nikdy nezobrazují — jen to, jestli jsou nastavené.
      </p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-card bg-fill" />}>
        <Status />
      </Suspense>
    </main>
  );
}
