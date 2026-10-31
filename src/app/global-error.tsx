"use client";

// Replaces the root layout when it fails, so it styles itself inline. It shows
// the error text: client-side errors keep their message, which makes a crash
// on a device we can't debug (e.g. an old iPad) reportable from a screenshot.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const err = error instanceof Error ? (error as Error & { digest?: string }) : null;
  const detail = err ? [err.name + ": " + err.message, err.digest && "digest " + err.digest].filter(Boolean).join(" · ") : String(error);
  const stack = err?.stack?.split("\n").slice(0, 4).join("\n");

  return (
    <html lang="cs">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f2f2f7",
          color: "#1d1d1f",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <title>Chyba · StudyDrive</title>
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Stránku se nepodařilo načíst</h1>
          <p style={{ margin: "0 0 16px", color: "#6e6e73" }}>Zkus ji načíst znovu. Pokud se chyba opakuje, pošli screenshot téhle obrazovky.</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{ border: 0, borderRadius: 999, padding: "10px 18px", background: "#0071e3", color: "#fff", fontWeight: 600, fontSize: 15 }}
            >
              Zkusit znovu
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ border: 0, borderRadius: 999, padding: "10px 18px", background: "rgba(120,120,128,0.16)", color: "#1d1d1f", fontWeight: 600, fontSize: 15 }}
            >
              Obnovit stránku
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              padding: 12,
              borderRadius: 10,
              background: "#fff",
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#6e6e73",
            }}
          >
            {detail}
            {stack ? "\n\n" + stack : ""}
            {typeof navigator !== "undefined" ? "\n\n" + navigator.userAgent : ""}
          </pre>
        </div>
      </body>
    </html>
  );
}
