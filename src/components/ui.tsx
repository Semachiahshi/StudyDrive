import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { PACE_LABEL, type PaceState } from "@/lib/domain/pace";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- layout

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-1 pt-2 md:pt-6">
      {back && (
        <Link
          href={back.href}
          className="touch-target -ml-1 inline-flex w-fit items-center gap-0.5 text-callout text-accent-text"
        >
          <Icon name="chevronLeft" size={18} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-large-title font-bold text-balance">{title}</h1>
          {subtitle && <p className="mt-1 text-subheadline text-label-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mb-8", className)}>
      {(title || action) && (
        <div className="mb-2.5 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            {title && <h2 className="text-title-3 font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-footnote text-label-2">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({ children, className, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-card bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

/** Inset grouped list (iOS settings style). */
export function List({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cx("overflow-hidden", className)}>
      <ul className="divide-y divide-separator">{children}</ul>
    </Card>
  );
}

export function ListRow({
  href,
  children,
  trailing,
  className,
}: {
  href?: string;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
      {href && <Icon name="chevronRight" size={16} className="shrink-0 text-label-3" />}
    </>
  );
  const base = "flex min-h-[52px] items-center gap-3 px-4 py-3";
  return (
    <li>
      {href ? (
        <Link href={href} className={cx(base, "transition-colors hover:bg-fill active:bg-fill-strong", className)}>
          {inner}
        </Link>
      ) : (
        <div className={cx(base, className)}>{inner}</div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------- controls

type ButtonVariant = "filled" | "tinted" | "plain" | "gray" | "destructive" | "success";

const BUTTON: Record<ButtonVariant, string> = {
  filled: "bg-accent text-on-accent hover:brightness-110 active:brightness-95",
  tinted: "bg-accent-tint text-accent-text hover:brightness-105",
  gray: "bg-fill text-label hover:bg-fill-strong",
  plain: "text-accent-text hover:bg-fill",
  destructive: "bg-red-tint text-red hover:brightness-105",
  success: "bg-green-tint text-green hover:brightness-105",
};

export function buttonClass(variant: ButtonVariant = "filled", size: "md" | "sm" = "md") {
  return cx(
    "touch-target inline-flex select-none items-center justify-center gap-1.5 rounded-full font-semibold transition",
    "disabled:cursor-not-allowed disabled:opacity-40",
    size === "md" ? "min-h-10 px-4 text-subheadline" : "min-h-8 px-3 text-footnote",
    BUTTON[variant],
  );
}

export function Button({
  variant = "filled",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: "md" | "sm"; icon?: IconName }) {
  return (
    <button className={cx(buttonClass(variant, size), className)} {...rest}>
      {icon && <Icon name={icon} size={size === "md" ? 18 : 16} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "filled",
  size = "md",
  icon,
  children,
  className,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: IconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cx(buttonClass(variant, size), className)}>
      {icon && <Icon name={icon} size={size === "md" ? 18 : 16} />}
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------- status

const STATUS_STYLE: Record<PaceState, { className: string; icon: IconName }> = {
  on_track: { className: "bg-green-tint text-green", icon: "checkCircle" },
  at_risk: { className: "bg-orange-tint text-orange", icon: "warning" },
  behind: { className: "bg-red-tint text-red", icon: "warning" },
  done: { className: "bg-green-tint text-green", icon: "check" },
  no_date: { className: "bg-fill text-label-2", icon: "calendar" },
  no_topics: { className: "bg-fill text-label-2", icon: "info" },
  exam_passed: { className: "bg-fill text-label-2", icon: "flag" },
};

export function StatusBadge({ state, estimate }: { state: PaceState; estimate?: boolean }) {
  const s = STATUS_STYLE[state];
  return (
    <span className={cx("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-footnote font-semibold", s.className)}>
      <Icon name={s.icon} size={14} strokeWidth={2.2} />
      {PACE_LABEL[state]}
      {estimate && (state === "on_track" || state === "at_risk" || state === "behind") && (
        <span className="font-normal opacity-80">· odhad</span>
      )}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-fill px-1.5 py-0.5 text-caption font-semibold text-label-2", className)}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- progress

/** Determinate circular progress (not an Activity ring — those are reserved for Fitness). */
export function ProgressRing({
  ratio,
  size = 120,
  stroke = 12,
  color = "var(--accent)",
  label,
  children,
}: {
  ratio: number | null;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = ratio === null ? 0 : Math.min(Math.max(ratio, 0), 1);
  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ratio === null ? undefined : Math.round(value * 100)}
      aria-valuetext={ratio === null ? "Zatím bez dat" : `${Math.round(value * 100)} %`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        {value > 0 && (
          <circle
            className="ring-progress"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value)}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ ratio, color = "var(--accent)", label }: { ratio: number | null; color?: string; label: string }) {
  const value = ratio === null ? 0 : Math.min(Math.max(ratio, 0), 1);
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-fill"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ratio === null ? undefined : Math.round(value * 100)}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${value * 100}%`, background: color }} />
    </div>
  );
}

// ---------------------------------------------------------------- empty states

export function EmptyState({
  icon,
  title,
  children,
  action,
  compact,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className={cx("flex flex-col items-center text-center", compact ? "px-5 py-7" : "px-6 py-12")}>
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-fill text-label-2">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="text-headline font-semibold">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-subheadline text-label-2">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-card bg-fill", className)} />;
}

export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Načítám">
      <div className="mb-6 pt-2 md:pt-6">
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="mt-2 h-4 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="mt-6 h-64" />
    </div>
  );
}

// ---------------------------------------------------------------- forms

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="px-1 text-footnote font-semibold text-label-2">
        {label}
      </label>
      {children}
      {hint && <p className="px-1 text-caption text-label-2">{hint}</p>}
    </div>
  );
}

export const inputClass = cx(
  "touch-target w-full rounded-control border border-separator bg-elevated px-3 py-2.5 text-body text-label",
  "placeholder:text-label-3 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent-tint",
);

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx(inputClass, props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(inputClass, "min-h-24", props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cx(inputClass, "appearance-auto", props.className)} />;
}

export function Toggle({ name, defaultChecked, label, description }: { name: string; defaultChecked?: boolean; label: string; description?: string }) {
  return (
    <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-body">{label}</span>
        {description && <span className="mt-0.5 block text-footnote text-label-2">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-[31px] w-[51px] rounded-full bg-fill-strong transition peer-checked:bg-green peer-focus-visible:ring-3 peer-focus-visible:ring-accent-tint" />
        <span className="absolute left-0.5 top-0.5 size-[27px] rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-1.5 rounded-control bg-red-tint px-3 py-2 text-footnote text-red">
      <Icon name="warning" size={16} className="mt-px shrink-0" />
      {message}
    </p>
  );
}
