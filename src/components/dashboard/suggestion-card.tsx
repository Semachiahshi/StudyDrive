"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";

const KEY = "studydrive:suggestion-hidden";

/** Wraps the optional suggestion so it can be hidden for the rest of the day. */
export function DismissibleSuggestion({ today, children }: { today: string; children: ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      // Read once after mount; storage is unavailable during server render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(window.localStorage.getItem(KEY) === today);
    } catch {
      // Private mode or blocked storage: just keep it visible.
    }
  }, [today]);

  if (hidden) {
    return (
      <button
        type="button"
        className="touch-target mb-8 inline-flex items-center gap-1.5 px-1 text-footnote text-accent-text"
        onClick={() => {
          setHidden(false);
          try {
            window.localStorage.removeItem(KEY);
          } catch {}
        }}
      >
        <Icon name="sparkle" size={14} />
        Zobrazit dnešní návrh
      </button>
    );
  }

  return (
    <div className="relative">
      {children}
      <button
        type="button"
        aria-label="Skrýt návrh na dnešek"
        title="Skrýt na dnešek"
        className="touch-target absolute right-3 top-3 grid size-8 place-items-center rounded-full text-label-2 hover:bg-fill"
        onClick={() => {
          setHidden(true);
          try {
            window.localStorage.setItem(KEY, today);
          } catch {}
        }}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function SuggestionLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-accent-text hover:underline">
      {children}
    </Link>
  );
}
