/** Canais oficiais de contato do CCMF — fonte única para site e e-mails. */
export const CONTACT = {
  whatsapp: {
    display: "(43) 98436-9429",
    e164: "5543984369429",
  },
  phone: {
    display: "(43) 99634-4762",
    e164: "5543996344762",
  },
  email: "byclaudiacavalcante@yahoo.com.br",
} as const;

/** Link wa.me com mensagem pré-preenchida opcional. */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsapp.e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
