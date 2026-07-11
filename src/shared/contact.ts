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

/** Redes sociais oficiais do CCMF — fonte única para site, SEO e e-mails. */
export const SOCIAL = {
  instagram: {
    handle: "@concursocriancamaisfotogenica",
    url: "https://www.instagram.com/concursocriancamaisfotogenica/",
  },
  facebook: {
    label: "Concurso Criança Mais Fotogênica do Brasil",
    url: "https://www.facebook.com/people/Concurso-Crian%C3%A7a-Mais-Fotog%C3%AAnica-do-Brasil/100060315901272/",
  },
} as const;

/** Link wa.me com mensagem pré-preenchida opcional. */
export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsapp.e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
