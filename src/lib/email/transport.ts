import nodemailer from "nodemailer";

import {
  getEmailFrom,
  getSmtpCredentials,
  getSmtpHost,
  getSmtpPort,
  isEmailServiceConfigured,
} from "@/lib/email/config";

export function createMailTransport() {
  if (!isEmailServiceConfigured()) {
    throw new Error("Gmail/SMTP no configurado");
  }

  const { user, pass } = getSmtpCredentials();

  return nodemailer.createTransport({
    host: getSmtpHost(),
    port: getSmtpPort(),
    secure: getSmtpPort() === 465,
    auth: {
      user: user!,
      pass: pass!,
    },
  });
}

export async function sendMail(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const transport = createMailTransport();

  const info = await transport.sendMail({
    from: getEmailFrom(),
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  return info.messageId;
}
