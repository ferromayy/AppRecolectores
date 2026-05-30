import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { canManageUsers, isSuperadminUser } from "@/lib/auth/permissions";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/types/database";
import type { UserRole } from "@/lib/auth/constants";

const PUBLIC_PREFIXES = ["/login", "/auth", "/api/health", "/api/db/status"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isStaffProfile(role: UserRole | undefined) {
  return role === "superadmin" || role === "admin";
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
    if (pathname === "/admin/usuarios" || pathname.startsWith("/admin/usuarios/")) {
      return NextResponse.redirect(new URL("/panel/usuarios", request.url));
    }

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

    if (!isSuperadminUser(profile, user.email)) {
      const denied = new URL("/login", request.url);
      denied.searchParams.set("error", "sin_permiso");
      return NextResponse.redirect(denied);
    }
  }

  if (
    pathname === "/panel/rutas" ||
    pathname.startsWith("/panel/rutas/")
  ) {
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

    if (!isStaffProfile(profile?.role)) {
      return NextResponse.redirect(new URL("/panel", request.url));
    }
  }

  if (
    pathname === "/panel/usuarios" ||
    pathname.startsWith("/panel/usuarios/")
  ) {
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

    if (!canManageUsers(profile)) {
      return NextResponse.redirect(new URL("/panel", request.url));
    }
  }

  if (pathname === "/login" && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "recolector") {
      return NextResponse.redirect(new URL("/panel/mis-rutas", request.url));
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
