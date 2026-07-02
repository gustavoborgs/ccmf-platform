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

/**
 * Boas-vindas pós-pagamento: confirma a inscrição e entrega o bônus (curso
 * premium) imediatamente, aumentando o valor percebido da compra.
 * Plano: docs/academy-plano-conversao.md (fase 3)
 */
export async function sendPaymentConfirmedEmail(input: {
  to: string;
  name: string;
  participantName: string;
  protocol: string;
  courseUrl: string;
}): Promise<void> {
  const subject = "Inscrição confirmada! Seu brinde já está liberado";
  const escapedName = escapeHtml(input.name);
  const escapedParticipant = escapeHtml(input.participantName);
  const escapedProtocol = escapeHtml(input.protocol);
  const escapedCourseUrl = escapeHtml(input.courseUrl);

  const text = [
    `Olá, ${input.name}!`,
    "",
    `A inscrição de ${input.participantName} no Concurso Criança Mais Fotogênica foi confirmada. Protocolo: ${input.protocol}.`,
    "",
    "E tem mais: seu brinde de inscrição já está liberado.",
    "O curso \"Como Gerenciar a Carreira do Seu Filho\", escrito pela fundadora Claudia Cavalcante já está disponível na sua conta.",
    "",
    `Comece agora pela carta da Claudia (leva menos de 10 minutos): ${input.courseUrl}`,
    "",
    "Acompanhe o status da avaliação das fotos pela sua conta.",
    "",
    "Com carinho,",
    "Equipe CCMF",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.6">
      <h1 style="color:#8e18b4">Inscrição confirmada!</h1>
      <p>Olá, ${escapedName}!</p>
      <p>
        A inscrição de <strong>${escapedParticipant}</strong> no Concurso Criança Mais
        Fotogênica foi confirmada. Protocolo:
        <strong style="font-family:monospace">${escapedProtocol}</strong>.
      </p>
      <div style="margin:24px 0;border-radius:16px;background:linear-gradient(135deg,#8e18b4,#ec1380);padding:24px;color:#fff">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">
          Seu brinde de inscrição já está liberado
        </p>
        <h2 style="margin:8px 0 4px;color:#fff">Como Gerenciar a Carreira do Seu Filho</h2>
        <p style="margin:0 0 16px;color:rgba(255,255,255,0.9)">
          O curso completo da Claudia Cavalcante é seu
          de graça por participar do concurso. 27 capítulos de gestão de carreira infantil,
          com método e proteção da infância.
        </p>
        <a href="${escapedCourseUrl}" style="display:inline-block;border-radius:999px;background:#fff;color:#c2055f;padding:12px 20px;text-decoration:none;font-weight:700">
          Começar o curso agora
        </a>
      </div>
      <p>
        A carta de abertura da Claudia leva menos de 10 minutos. Depois, acompanhe o status
        da avaliação das fotos pela sua conta.
      </p>
      <p>Com carinho,<br/>Equipe CCMF</p>
    </div>
  `;

  await sendEmail({ to: input.to, subject, html, text });
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
