import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "app-recolectores",
    timestamp: new Date().toISOString(),
    supabase: isSupabaseConfigured() ? "configured" : "missing_env",
  });
}
