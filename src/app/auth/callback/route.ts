import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/panel";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination =
        type === "recovery" || next.includes("actualizar-contrasena")
          ? "/auth/actualizar-contrasena"
          : next.startsWith("/")
            ? next
            : `/${next}`;
      return NextResponse.redirect(`${origin}${destination}`);
    }

    const expired =
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("invalid");
    const errorKey = expired ? "link_expired" : "auth_callback";
    return NextResponse.redirect(`${origin}/login?error=${errorKey}`);
  }

  const authError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  if (authError || errorCode === "otp_expired") {
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
