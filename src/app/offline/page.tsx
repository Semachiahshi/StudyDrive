import type { Metadata } from "next";
import { AppMark } from "@/components/app-mark";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <div className="flex justify-center">
          <AppMark size={56} />
        </div>
        <h1 className="mt-4 text-title-2 font-bold">Jsi offline</h1>
        <p className="mt-2 text-subheadline text-label-2">
          Tuhle stránku zatím nemáš uloženou. Stránky, které jsi otevřel online, se ukážou i bez připojení. Jakmile budeš zase online, obnov stránku.
        </p>
      </div>
    </main>
  );
}
