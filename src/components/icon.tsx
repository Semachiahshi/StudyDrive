// Line icons drawn in the spirit of SF Symbols (SF Symbols themselves are
// licensed for Apple-platform apps only, so they are not used on the web).

const PATHS = {
  overview: "M4 13.5 12 5l8 8.5M6.5 11v8.5h4.25v-5h2.5v5h4.25V11",
  subjects: "M5 4.5h4v15H5zM10.5 4.5h4v15h-4zM16 5.8l3.6-1 3.4 13.7-3.6 1z",
  calendar: "M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4",
  files: "M3.5 7V18.5h17V8.5h-9L9.5 6h-6z",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  check: "M5 12.5 10 17.5 19 7",
  checkCircle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.3l2.7 2.7L16 9.5",
  circle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  plus: "M12 5v14M5 12h14",
  chevronRight: "M9.5 5.5 16 12l-6.5 6.5",
  chevronLeft: "M14.5 5.5 8 12l6.5 6.5",
  play: "M8 5.5v13l10.5-6.5z",
  stop: "M7 7h10v10H7z",
  flame:
    "M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.3-2.1-5.6-3.9-7.6-.4 1.7-1.3 3-2.6 3.7.2-3.1-1.1-5.7-3.5-7.4.2 2.7-1 4.6-2.4 6.3C4.9 11.3 5.5 13.6 5.5 14.8 5.5 18.4 8.1 21 12 21z",
  flag: "M5.5 21V4M5.5 4.5h11.5l-2.5 4 2.5 4H5.5",
  warning: "M12 3.8 2.8 19.5h18.4zM12 10v4.2M12 16.8v.2",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.8v.2",
  upload: "M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 15v4.5h15V15",
  download: "M12 4v11.5M7.5 11 12 15.5l4.5-4.5M4.5 15v4.5h15V15",
  trash: "M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l1 13h9l1-13M10 10.5v6M14 10.5v6",
  pencil: "M15.5 4.5l4 4L9 19H5v-4z",
  close: "M6 6l12 12M18 6 6 18",
  doc: "M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6",
  note: "M5 4.5h14v15H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4",
  undo: "M9 14.5 4.5 10 9 5.5M4.5 10h10a5 5 0 0 1 0 10H11",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2",
  mail: "M3.5 6h17v12h-17zM3.5 6.5l8.5 7 8.5-7",
  archive: "M3.5 4.5h17v4h-17zM5 8.5v11h14v-11M10 12.5h4",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  route: "M6 19.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17.5h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16",
  signOut: "M14 4.5H5v15h9M10 12h10M16.5 8.5 20 12l-3.5 3.5",
  sparkle: "M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
  label,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  /** Accessible label; omit for decorative icons. */
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
