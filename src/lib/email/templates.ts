type InviteEmailParams = {
  fullName?: string;
  roleLabel: string;
  actionLink: string;
};

type ResetEmailParams = {
  fullName?: string;
  actionLink: string;
};

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#171717;max-width:520px;margin:0 auto;padding:24px">
  <p style="font-size:12px;color:#059669;font-weight:600;letter-spacing:.05em;text-transform:uppercase">App Recolectores · Ecolink</p>
  <h1 style="font-size:20px;margin:16px 0 8px">${title}</h1>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#71717a">Si no solicitaste este correo, ignoralo.</p>
</body>
</html>`;
}

export function inviteEmailHtml(params: InviteEmailParams) {
  const greeting = params.fullName
    ? `Hola ${params.fullName},`
    : "Hola,";

  return layout(
    "Activá tu cuenta",
    `<p>${greeting}</p>
<p>Te dieron acceso como <strong>${params.roleLabel}</strong> en la plataforma interna de Ecolink.</p>
<p><a href="${params.actionLink}" style="display:inline-block;background:#047857;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Definir contraseña y entrar</a></p>
<p style="font-size:13px;color:#52525b">O copiá este enlace en el navegador:<br><a href="${params.actionLink}">${params.actionLink}</a></p>`,
  );
}

export function passwordResetEmailHtml(params: ResetEmailParams) {
  const greeting = params.fullName
    ? `Hola ${params.fullName},`
    : "Hola,";

  return layout(
    "Cambiar contraseña",
    `<p>${greeting}</p>
<p>El superadmin autorizó un cambio de contraseña para tu cuenta.</p>
<p><a href="${params.actionLink}" style="display:inline-block;background:#047857;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Elegir nueva contraseña</a></p>
<p style="font-size:13px;color:#52525b">El enlace expira en 24 horas. Si no lo pediste, contactá a soporte.</p>
<p style="font-size:13px;color:#52525b"><a href="${params.actionLink}">${params.actionLink}</a></p>`,
  );
}

export function inviteEmailText(params: InviteEmailParams) {
  return `${params.fullName ? `Hola ${params.fullName}` : "Hola"},\n\nActivá tu cuenta como ${params.roleLabel}:\n${params.actionLink}`;
}

export function passwordResetEmailText(params: ResetEmailParams) {
  return `${params.fullName ? `Hola ${params.fullName}` : "Hola"},\n\nCambiá tu contraseña:\n${params.actionLink}`;
}
