import { env } from "@/shared/env";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(input: EmailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email] RESEND_API_KEY ausente. Email simulado:", input);
      return;
    }

    throw new Error("RESEND_API_KEY não configurada.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    console.error("[email] Resend request failed", { status: response.status, body });
    throw new Error("Falha ao enviar e-mail.");
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const subject = "Recupere sua senha no CCMF";
  const escapedName = escapeHtml(input.name);
  const escapedResetUrl = escapeHtml(input.resetUrl);
  const text = [
    `Olá, ${input.name}.`,
    "",
    "Recebemos uma solicitação para redefinir sua senha no CCMF.",
    `Acesse o link abaixo para criar uma nova senha: ${input.resetUrl}`,
    "",
    "Este link expira em 1 hora. Se você não solicitou a recuperação, ignore este e-mail.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6">
      <h1 style="color:#6d28d9">Recupere sua senha</h1>
      <p>Olá, ${escapedName}.</p>
      <p>Recebemos uma solicitação para redefinir sua senha no CCMF.</p>
      <p>
        <a href="${escapedResetUrl}" style="display:inline-block;border-radius:999px;background:#ec4899;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">
          Criar nova senha
        </a>
      </p>
      <p>Este link expira em 1 hora.</p>
      <p>Se você não solicitou a recuperação, ignore este e-mail.</p>
    </div>
  `;

  await sendEmail({ to: input.to, subject, html, text });
}
