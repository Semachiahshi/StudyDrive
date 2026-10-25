// Environment configuration. Only NEXT_PUBLIC_* values may reach the browser;
// everything else here is read on the server.

export function supabasePublicEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

/**
 * Emails allowed to sign in (comma separated, server-side only). Fails closed:
 * when OWNER_EMAILS is not set, nobody can sign in.
 */
export function ownerEmails(): Set<string> {
  return new Set(
    (process.env.OWNER_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  return !!email && ownerEmails().has(email.trim().toLowerCase());
}

export function appUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export type ConfigCheck = { name: string; ok: boolean; purpose: string };

/** What is configured — names and booleans only, never values. */
export function configurationStatus(): ConfigCheck[] {
  return [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      ok: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      purpose: "Adresa projektu Supabase",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      ok: !!(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      purpose: "Veřejný klíč Supabase pro prohlížeč",
    },
    { name: "OWNER_EMAILS", ok: ownerEmails().size > 0, purpose: "E-mail(y), které se smí přihlásit" },
    {
      name: "SUPABASE_SECRET_KEY",
      ok: !!(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
      purpose: "Serverový klíč pro odesílání upozornění (jen na serveru)",
    },
    { name: "RESEND_API_KEY", ok: !!process.env.RESEND_API_KEY, purpose: "Doručování e-mailových upozornění" },
    { name: "REMINDER_FROM_EMAIL", ok: !!process.env.REMINDER_FROM_EMAIL, purpose: "Odesílatel upozornění" },
    { name: "CRON_SECRET", ok: !!process.env.CRON_SECRET, purpose: "Ochrana plánované úlohy upozornění" },
  ];
}

export function remindersConfigured(): boolean {
  return configurationStatus()
    .filter((c) => ["SUPABASE_SECRET_KEY", "RESEND_API_KEY", "REMINDER_FROM_EMAIL", "CRON_SECRET"].includes(c.name))
    .every((c) => c.ok);
}
