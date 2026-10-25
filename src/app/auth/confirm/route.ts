import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "magiclink", "invite", "recovery", "email_change"];

/**
 * Handles the link in login/invite emails. Supports both our templates
 * (`?token_hash=…&type=…`) and Supabase's default templates, whose link comes
 * back with a PKCE `?code=…` (works in the browser that requested the email).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const fail = NextResponse.redirect(new URL("/login?error=link-invalid", request.url));

  const supabase = await createClient();
  let email: string | null | undefined;

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return fail;
    email = data.user?.email;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail;
    email = data.user?.email;
  } else {
    return fail;
  }

  if (!isOwnerEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not-allowed", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
