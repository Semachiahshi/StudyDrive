import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "magiclink", "invite", "recovery", "email_change"];

function isAllowedType(type: string | null): type is EmailOtpType {
  return !!type && ALLOWED_TYPES.includes(type as EmailOtpType);
}

function redirectTo(request: NextRequest, path: string) {
  // 303 so a POST is followed by a GET.
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

async function finish(request: NextRequest, email: string | null | undefined) {
  if (!isOwnerEmail(email)) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirectTo(request, "/login?error=not-allowed");
  }
  return redirectTo(request, "/");
}

/**
 * Handles the link in login/invite emails.
 *
 * Our templates link here with `?token_hash=…&type=…`. Mail providers (Seznam
 * among them) open links in incoming mail to scan them, and a plain GET that
 * verified the token would use it up — killing both the link and the code from
 * the same email. So GET only shows a confirm page; the token is spent by the
 * POST from its button, which scanners do not press.
 *
 * Supabase's default templates come back with a PKCE `?code=…` instead. That
 * only works in the browser that requested the email (a scanner has no code
 * verifier), so it is exchanged right away.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");

  if (tokenHash && isAllowedType(type)) {
    const confirm = new URLSearchParams({ token_hash: tokenHash, type });
    return redirectTo(request, `/login/confirm?${confirm}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return redirectTo(request, "/login?error=link-invalid");
    return finish(request, data.user?.email);
  }

  return redirectTo(request, "/login?error=link-invalid");
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tokenHash = form.get("token_hash");
  const type = form.get("type");
  if (typeof tokenHash !== "string" || !tokenHash || typeof type !== "string" || !isAllowedType(type)) {
    return redirectTo(request, "/login?error=link-invalid");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return redirectTo(request, "/login?error=link-invalid");
  return finish(request, data.user?.email);
}
