"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { appUrl, isOwnerEmail, supabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string; notice?: string };

const emailSchema = z.email().max(254);
// Supabase email codes are 6 digits by default; projects can configure up to 10.
const codeSchema = z.string().regex(/^\d{6,10}$/);

async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : appUrl();
}

export async function requestCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!supabasePublicEnv()) return { step: "email", error: "Aplikace zatím není propojená se Supabase." };
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { step: "email", error: "Zadej platný e-mail." };
  const email = parsed.data;

  // Only the configured owner gets an email. Others see the same screen, so
  // the allowlist is not revealed — and no account can be created here.
  if (isOwnerEmail(email)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
    });
    if (error) {
      const tooMany = error.status === 429 || /rate|seconds/i.test(error.message);
      return {
        step: "email",
        error: tooMany ? "Kód jsme poslali před chvílí. Zkus to prosím za minutu." : "Kód se nepodařilo odeslat. Zkus to znovu.",
      };
    }
  }

  return {
    step: "code",
    email,
    notice: "Pokud je tento e-mail povolený, poslali jsme na něj přihlašovací kód.",
  };
}

export async function verifyCode(prev: LoginState, formData: FormData): Promise<LoginState> {
  if (prev.step !== "code") return prev;
  if (formData.get("intent") === "back") return { step: "email" };

  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!codeSchema.safeParse(token).success) return { ...prev, notice: undefined, error: "Zadej celý číselný kód z e-mailu." };
  if (!isOwnerEmail(prev.email)) return { ...prev, notice: undefined, error: "Kód není platný nebo vypršel." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: prev.email, token, type: "email" });
  if (error) return { ...prev, notice: undefined, error: "Kód není platný nebo vypršel." };

  redirect("/");
}

export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  return prev.step === "email" ? requestCode(prev, formData) : verifyCode(prev, formData);
}
