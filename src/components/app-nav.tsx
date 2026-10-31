"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
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

/**
 * Collapses the sidebar to an icon rail and back. The state lives on <html
 * data-sidebar> (restored before first paint by the root layout) and in
 * localStorage; the widths are plain CSS in globals.css so old Safari gets
 * them too.
 */
function subscribeSidebar(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  return () => observer.disconnect();
}

function SidebarToggle() {
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    () => document.documentElement.getAttribute("data-sidebar") === "collapsed",
    () => false,
  );

  function toggle() {
    const next = !collapsed;
    if (next) document.documentElement.setAttribute("data-sidebar", "collapsed");
    else document.documentElement.removeAttribute("data-sidebar");
    try {
      localStorage.setItem("sidebar", next ? "collapsed" : "expanded");
    } catch {}
  }

  const label = collapsed ? "Zobrazit postranní panel" : "Skrýt postranní panel";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-expanded={!collapsed}
      aria-controls="app-sidebar"
      className="sidebar-toggle touch-target grid size-9 shrink-0 place-items-center rounded-lg text-label-2 transition-colors hover:bg-fill hover:text-label"
    >
      <Icon name="sidebar" size={20} />
    </button>
  );
}

/** iPad and Mac: sidebar. `pathname` is null in the prerendered shell (no highlight yet). */
export function SidebarView({ pathname }: { pathname: string | null }) {
  return (
    <aside id="app-sidebar" className="app-sidebar material fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-separator px-3 pb-4 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <div className="sidebar-head mb-5 flex items-center justify-between gap-2">
        <Link href="/" className="sidebar-brand flex min-w-0 items-center gap-2.5 px-1.5" title="StudyDrive">
          <AppMark size={30} />
          <span className="nav-label truncate text-headline font-semibold">StudyDrive</span>
        </Link>
        <SidebarToggle />
      </div>
      <nav aria-label="Hlavní navigace" className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname !== null && item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={cx(
                "nav-item touch-target flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-subheadline transition-colors",
                active ? "bg-accent text-on-accent" : "text-label hover:bg-fill",
              )}
            >
              <Icon name={item.icon} size={20} className={cx("shrink-0", !active && "text-accent-text")} />
              <span className="nav-label truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <form action="/auth/signout" method="post" className="mt-auto">
        <button
          type="submit"
          title="Odhlásit se"
          className="nav-item touch-target flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-subheadline text-label-2 transition-colors hover:bg-fill"
        >
          <Icon name="signOut" size={20} className="shrink-0" />
          <span className="nav-label truncate">Odhlásit se</span>
        </button>
      </form>
    </aside>
  );
}

/** iPhone: tab bar. */
export function TabBarView({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Hlavní navigace" className="app-tabbar material pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-separator">
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
