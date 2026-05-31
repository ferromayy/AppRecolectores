const DEFAULT_REGION = "Argentina";
const DEFAULT_CITY = "Córdoba";

export type GeocodeResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
};

export type GeocodeFailure = {
  ok: false;
  status: string;
  query: string;
  errorMessage?: string;
};

export type GeocodeSuccess = GeocodeResult & { ok: true; query: string };

export function buildGeocodeQuery(parts: {
  direccion: string;
  barrio?: string | null;
  depto?: string | null;
  ciudad?: string | null;
}): string {
  const direccion = parts.direccion.trim();
  const chunks = [direccion];
  if (parts.depto?.trim()) chunks.push(`Depto ${parts.depto.trim()}`);
  if (parts.barrio?.trim()) chunks.push(parts.barrio.trim());

  const lower = direccion.toLowerCase();
  const city = parts.ciudad?.trim();
  if (city && !lower.includes(city.toLowerCase())) {
    chunks.push(city);
  } else if (
    !/\bc[oó]rdoba\b/i.test(direccion) &&
    !/\bargentina\b/i.test(direccion) &&
    !/\bx\d{4}\b/i.test(direccion)
  ) {
    chunks.push(DEFAULT_CITY);
  }

  if (!/\bargentina\b/i.test(chunks.join(" "))) {
    chunks.push(DEFAULT_REGION);
  }

  return chunks.filter(Boolean).join(", ");
}

export async function geocodeAddress(
  query: string,
  apiKey: string,
): Promise<GeocodeSuccess | GeocodeFailure> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "ar");
  url.searchParams.set("language", "es");
  url.searchParams.set("components", "country:AR");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return { ok: false, status: "HTTP_ERROR", query, errorMessage: response.statusText };
  }

  const body = (await response.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };

  if (body.status !== "OK" || !body.results?.[0]) {
    return {
      ok: false,
      status: body.status,
      query,
      errorMessage: body.error_message,
    };
  }

  const hit = body.results[0];
  return {
    ok: true,
    query,
    lat: hit.geometry.location.lat,
    lng: hit.geometry.location.lng,
    formattedAddress: hit.formatted_address,
  };
}

/** Intenta geocodificar con variantes de la dirección. */
export async function geocodeAddressWithFallback(
  parts: {
    direccion: string;
    barrio?: string | null;
    depto?: string | null;
  },
  apiKey: string,
): Promise<GeocodeSuccess | GeocodeFailure> {
  const queries = [
    buildGeocodeQuery(parts),
    buildGeocodeQuery({ ...parts, ciudad: DEFAULT_CITY }),
    `${parts.direccion.trim()}, ${DEFAULT_CITY}, ${DEFAULT_REGION}`,
  ];

  const tried = new Set<string>();
  let lastFailure: GeocodeFailure = {
    ok: false,
    status: "ZERO_RESULTS",
    query: queries[0],
  };

  for (const query of queries) {
    if (tried.has(query)) continue;
    tried.add(query);
    const result = await geocodeAddress(query, apiKey);
    if (result.ok) return result;
    lastFailure = result;
  }

  return lastFailure;
}

export function latLngToDms(lat: number, lng: number): string {
  function part(value: number, pos: string, neg: string) {
    const abs = Math.abs(value);
    const d = Math.floor(abs);
    const mFloat = (abs - d) * 60;
    const m = Math.floor(mFloat);
    const s = Math.round((mFloat - m) * 60);
    const hemi = value >= 0 ? pos : neg;
    return `${d}°${m}'${s}"${hemi}`;
  }
  return `${part(lat, "N", "S")} ${part(lng, "E", "W")}`;
}
