import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isOwnerEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "magiclink", "invite", "recovery", "email_change"];

/** Handles the link in login/invite emails (token_hash flow). */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const fail = NextResponse.redirect(new URL("/login?error=link-invalid", request.url));

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) return fail;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return fail;

  if (!isOwnerEmail(data.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=not-allowed", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
