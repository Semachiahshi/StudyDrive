import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/auth/", "/setup", "/offline", "/api/cron/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Refreshes the Supabase session cookie on every request and sends signed-out
 * visitors to the login page. This is an optimistic check only — every page
 * loader and server action verifies the owner again.
 */
export async function updateSession(request: NextRequest) {
  const env = supabasePublicEnv();
  const { pathname } = request.nextUrl;

  if (!env) {
    if (isPublic(pathname)) return NextResponse.next({ request });
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
