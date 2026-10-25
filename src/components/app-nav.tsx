"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppMark } from "./app-mark";
import { Icon, type IconName } from "./icon";
import { cx } from "./ui";

const NAV: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Přehled", icon: "overview", match: (p) => p === "/" },
  { href: "/subjects", label: "Předměty", icon: "subjects", match: (p) => p.startsWith("/subjects") || p.startsWith("/tracks") },
  { href: "/calendar", label: "Kalendář", icon: "calendar", match: (p) => p.startsWith("/calendar") },
  { href: "/files", label: "Soubory", icon: "files", match: (p) => p.startsWith("/files") },
  { href: "/settings", label: "Nastavení", icon: "settings", match: (p) => p.startsWith("/settings") },
];

/** Mac: sidebar. `pathname` is null in the prerendered shell (no highlight yet). */
export function SidebarView({ pathname }: { pathname: string | null }) {
  return (
    <aside className="material fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-separator px-3 pb-4 pt-6 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2.5">
        <AppMark size={30} />
        <span className="text-headline font-semibold">StudyDrive</span>
      </Link>
      <nav aria-label="Hlavní navigace" className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname !== null && item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-subheadline transition-colors",
                active ? "bg-accent text-on-accent" : "text-label hover:bg-fill",
              )}
            >
              <Icon name={item.icon} size={18} className={active ? undefined : "text-accent-text"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action="/auth/signout" method="post" className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-subheadline text-label-2 transition-colors hover:bg-fill"
        >
          <Icon name="signOut" size={18} />
          Odhlásit se
        </button>
      </form>
    </aside>
  );
}

/** iPhone: tab bar. */
export function TabBarView({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Hlavní navigace"
      className="material pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-separator lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map((item) => {
          const active = pathname !== null && item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-[50px] flex-col items-center justify-center gap-0.5 pt-1.5 text-[0.625rem] font-medium",
                  active ? "text-accent-text" : "text-label-2",
                )}
              >
                <Icon name={item.icon} size={24} strokeWidth={active ? 2.1 : 1.7} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar() {
  return <SidebarView pathname={usePathname()} />;
}

export function TabBar() {
  return <TabBarView pathname={usePathname()} />;
}
