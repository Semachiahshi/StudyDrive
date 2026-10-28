"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "./icon";

// Main pages the service worker keeps a fresh copy of for offline use.
const WARM_URLS = ["/", "/subjects", "/calendar", "/files", "/settings"];
const WARM_KEY = "studydrive:warmed-at";
const WARM_EVERY_MS = 10 * 60 * 1000;

const savedFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Prague",
});

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** The service worker marks a stored copy with `data-snapshot` (save time in ms). */
function snapshotSavedAt(): number | null {
  const value = Number(document.documentElement.dataset.snapshot);
  return value > 0 ? value : null;
}

function warmOfflineCopies() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const last = Number(localStorage.getItem(WARM_KEY));
    if (last && Date.now() - last < WARM_EVERY_MS) return;
    localStorage.setItem(WARM_KEY, String(Date.now()));
  } catch {
    // Storage blocked: warming on every visit is still fine.
  }
  navigator.serviceWorker.ready
    .then((registration) => registration.active?.postMessage({ type: "warm", urls: WARM_URLS }))
    .catch(() => {});
}

/**
 * Shows when the student is offline or looking at the last version saved
 * while online, and keeps that saved version fresh while online.
 */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const savedAt = useSyncExternalStore(subscribe, snapshotSavedAt, () => null);

  useEffect(() => {
    if (online && savedAt === null) warmOfflineCopies();
  }, [online, savedAt]);

  if (online && savedAt === null) return null;

  return (
    <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-card bg-orange-tint px-4 py-3">
      <Icon name="clock" size={18} className="text-orange" />
      <div className="min-w-0 flex-1">
        <p className="text-subheadline font-semibold">
          {online ? "Zobrazuješ uloženou verzi" : "Jsi offline"}
        </p>
        <p className="text-footnote text-label-2">
          {savedAt !== null
            ? `Poslední data z ${savedFormatter.format(new Date(savedAt))}. Změny teď nejde uložit.`
            : "Vidíš poslední načtená data. Změny teď nejde uložit."}
        </p>
      </div>
      {online && savedAt !== null && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-accent px-3 py-1 text-footnote font-semibold text-on-accent"
        >
          Načíst aktuální
        </button>
      )}
    </div>
  );
}
