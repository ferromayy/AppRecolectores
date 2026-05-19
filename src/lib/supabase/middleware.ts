import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPERADMIN_EMAIL } from "@/lib/auth/constants";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";

const PUBLIC_PREFIXES = ["/login", "/auth", "/api/health", "/api/db/status"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    if (!user) {
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isSuperadmin =
      profile?.role === "superadmin" &&
      user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

    if (!isSuperadmin) {
      const denied = new URL("/login", request.url);
      denied.searchParams.set("error", "sin_permiso");
      return NextResponse.redirect(denied);
    }
  }

  if (pathname === "/login" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "superadmin") {
      return NextResponse.redirect(new URL("/admin/usuarios", request.url));
    }
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  if (!isPublicPath(pathname) && pathname.startsWith("/panel") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
