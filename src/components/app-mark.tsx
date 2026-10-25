/* eslint-disable @next/next/no-img-element -- tiny static SVG, no optimization needed */
export function AppMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/icons/icon.svg"
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      style={{ borderRadius: size * 0.225 }}
    />
  );
}
