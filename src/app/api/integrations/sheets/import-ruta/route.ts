import { NextResponse } from "next/server";

import {
  importRutaFromSheets,
  validateImportPayload,
  verifySheetsImportSecret,
} from "@/lib/integrations/sheets-import";
import {
  getSheetsImportSecret,
  isSheetsImportConfigured,
} from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

function extractSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return request.headers.get("x-api-key")?.trim() ?? null;
}

export async function POST(request: Request) {
  if (!isSheetsImportConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Integración no configurada. Definí SHEETS_IMPORT_SECRET y la clave secreta de Supabase en el servidor.",
      },
      { status: 503 },
    );
  }

  const secret = getSheetsImportSecret()!;
  const provided = extractSecret(request);

  if (!verifySheetsImportSecret(provided, secret)) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const validated = validateImportPayload(body);
  if ("ok" in validated) {
    return NextResponse.json(validated, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error de configuración";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }

  const result = await importRutaFromSheets(admin, validated);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result, { status: result.reimported ? 200 : 201 });
}
