function readEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;

  const lower = raw.toLowerCase();
  if (
    lower.includes("xxxx") ||
    lower.startsWith("tu_") ||
    lower.includes("changeme")
  ) {
    return undefined;
  }

  return raw;
}

export function getSmtpCredentials() {
  const user = readEnv("GMAIL_USER") ?? readEnv("SMTP_USER");
  const pass = readEnv("GMAIL_APP_PASSWORD") ?? readEnv("SMTP_PASS");

  return { user, pass };
}

export function isEmailServiceConfigured(): boolean {
  const { user, pass } = getSmtpCredentials();
  return Boolean(user && pass);
}

export function getSmtpHost(): string {
  return readEnv("SMTP_HOST") || "smtp.gmail.com";
}

export function getSmtpPort(): number {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return Number.isFinite(port) ? port : 587;
}

export function getEmailFromAddress(): string {
  const { user } = getSmtpCredentials();
  return process.env.EMAIL_FROM?.trim() || user || "";
}

export function getEmailFrom(): string {
  const address = getEmailFromAddress();
  const name = process.env.EMAIL_FROM_NAME?.trim() || "App Recolectores";

  if (!address) {
    throw new Error(
      "Definí GMAIL_USER (o EMAIL_FROM) para el remitente del correo",
    );
  }

  return `${name} <${address}>`;
}
