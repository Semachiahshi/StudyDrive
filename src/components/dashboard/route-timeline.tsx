import Link from "next/link";
import { Icon, type IconName } from "@/components/icon";
import { cx } from "@/components/ui";
import { daysBetween, formatDateWindow, formatShortDate, relativeDays } from "@/lib/domain/dates";
import type { TimelineEvent } from "@/lib/model";

const KIND: Record<TimelineEvent["kind"], { icon: IconName; label: string; dot: string }> = {
  admin: { icon: "doc", label: "Administrativa", dot: "bg-orange" },
  target: { icon: "flag", label: "Cíl přípravy", dot: "bg-green" },
  exam: { icon: "calendar", label: "Zkouška", dot: "bg-accent" },
};

/**
 * "Cesta k maturitě": today, then upcoming deadlines, preparation targets and
 * exams in date order. Horizontal on wide screens, vertical on the iPhone.
 */
export function RouteTimeline({ today, events }: { today: string; events: TimelineEvent[] }) {
  const shown = events.slice(0, 8);
  const last = shown[shown.length - 1];
  const span = last ? Math.max(daysBetween(today, last.endDate ?? last.date), 1) : 1;

  return (
    <div className="rounded-card bg-surface p-4 shadow-card sm:p-5">
      {/* Wide: proportional horizontal route */}
      <div className="hidden @2xl:block">
        <div className="relative mx-3 mb-2 mt-10 h-1 rounded-full bg-fill">
          <div className="absolute -top-7 left-0 -translate-x-1/2 text-caption font-semibold text-accent-text">Dnes</div>
          <div className="absolute -top-1.5 left-0 size-4 -translate-x-1/2 rounded-full border-4 border-surface bg-accent shadow" />
          {shown.map((e, i) => {
            const left = (Math.max(daysBetween(today, e.date), 0) / span) * 100;
            return (
              <div
                key={e.id}
                className={cx("absolute -top-1 size-3 -translate-x-1/2 rounded-full ring-2 ring-surface", KIND[e.kind].dot, e.done && "opacity-40")}
                style={{ left: `${left}%` }}
                title={`${KIND[e.kind].label}: ${e.title} (${formatShortDate(e.date)})`}
                aria-hidden
                data-index={i}
              />
            );
          })}
        </div>
        <div className="mx-3 mb-4 flex justify-between text-caption text-label-2">
          <span>{formatShortDate(today)}</span>
          {last && <span>{formatShortDate(last.endDate ?? last.date)}</span>}
        </div>
      </div>

      <ol className="relative flex flex-col gap-0.5">
        {shown.map((e) => {
          const kind = KIND[e.kind];
          return (
            <li key={e.id}>
              <Link href={e.href} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-fill">
                <span className={cx("grid size-8 shrink-0 place-items-center rounded-full text-white", kind.dot, e.done && "opacity-50")}>
                  <Icon name={e.done ? "check" : kind.icon} size={16} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx("block truncate text-subheadline font-medium", e.done && "text-label-2 line-through")}>
                    {e.title}
                  </span>
                  <span className="block text-footnote text-label-2">
                    {kind.label} · {formatDateWindow(e.date, e.endDate)}
                    {e.estimate ? " · předběžně" : ""}
                  </span>
                </span>
                <span className="tabular shrink-0 text-footnote font-semibold text-label-2">{relativeDays(today, e.date)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      {events.length > shown.length && (
        <Link href="/calendar" className="mt-2 inline-flex items-center gap-0.5 px-2 text-footnote text-accent-text">
          Celý kalendář ({events.length})
          <Icon name="chevronRight" size={14} />
        </Link>
      )}
    </div>
  );
}
