import { isEmailServiceConfigured } from "@/lib/email/config";
import { sendMail } from "@/lib/email/transport";
import {
  inviteEmailHtml,
  inviteEmailText,
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "@/lib/email/templates";

type SendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; skipped?: boolean };

async function sendAuthEmail(payload: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  if (!isEmailServiceConfigured()) {
    return {
      ok: false,
      skipped: true,
      error: "Correo no configurado (GMAIL_USER / GMAIL_APP_PASSWORD)",
    };
  }

  try {
    const messageId = await sendMail(payload);
    return { ok: true, id: messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar";
    return { ok: false, error: message };
  }
}

export async function sendInvitationEmail(params: {
  to: string;
  fullName?: string;
  roleLabel: string;
  actionLink: string;
}): Promise<SendResult> {
  return sendAuthEmail({
    to: params.to,
    subject: "Activá tu cuenta — App Recolectores",
    html: inviteEmailHtml({
      fullName: params.fullName,
      roleLabel: params.roleLabel,
      actionLink: params.actionLink,
    }),
    text: inviteEmailText({
      fullName: params.fullName,
      roleLabel: params.roleLabel,
      actionLink: params.actionLink,
    }),
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  fullName?: string;
  actionLink: string;
}): Promise<SendResult> {
  return sendAuthEmail({
    to: params.to,
    subject: "Cambiar contraseña — App Recolectores",
    html: passwordResetEmailHtml({
      fullName: params.fullName,
      actionLink: params.actionLink,
    }),
    text: passwordResetEmailText({
      fullName: params.fullName,
      actionLink: params.actionLink,
    }),
  });
}

export { isEmailServiceConfigured };
