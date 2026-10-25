import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isOwnerEmail, supabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the signed-in owner for the current request. Redirects to setup,
 * login, or signs out a valid session whose email is not on the owner list.
 * Cached per request, so pages and actions can call it freely.
 */
export const requireOwner = cache(async () => {
  if (!supabasePublicEnv()) redirect("/setup");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  const email = typeof claims.email === "string" ? claims.email : null;
  if (!isOwnerEmail(email)) redirect("/auth/signout?reason=not-allowed");
  return { supabase, userId: claims.sub, email: email! };
});
