import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function signOut(request: NextRequest) {
  if (supabasePublicEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const reason = request.nextUrl.searchParams.get("reason");
  const target = reason === "not-allowed" ? "/login?error=not-allowed" : "/login";
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}

export async function POST(request: NextRequest) {
  return signOut(request);
}

// Used only to end a session whose email is not on the owner list.
export async function GET(request: NextRequest) {
  return signOut(request);
}
