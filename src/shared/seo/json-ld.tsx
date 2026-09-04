import { CONTACT, SOCIAL } from "@/shared/contact";
import { absoluteUrl, getSiteUrl } from "@/shared/site-url";

/** Organization enriquecido (E-E-A-T) — usado no layout público. */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Concurso Criança Mais Fotogênica do Brasil",
    alternateName: "CCMF",
    url: getSiteUrl(),
    logo: absoluteUrl("/brand/logo-full-menu.png"),
    email: CONTACT.email,
    foundingDate: "2007",
    description:
      "Concurso nacional de fotografia infantil com 19 edições, categorias por idade e avaliação técnica. Fundado por Claudia Cavalcante.",
    founder: {
      "@type": "Person",
      name: "Claudia Cavalcante",
      jobTitle: "Fundadora e fotógrafa",
    },
    sameAs: [SOCIAL.instagram.url, SOCIAL.facebook.url],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT.email,
      telephone: `+${CONTACT.whatsapp.e164}`,
      availableLanguage: "Portuguese",
    },
  };
}

/** WebSite — ajuda buscadores e motores generativos a identificar o site. */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Concurso Criança Mais Fotogênica do Brasil",
    alternateName: "CCMF",
    url: getSiteUrl(),
    inLanguage: "pt-BR",
    publisher: {
      "@type": "Organization",
      name: "Concurso Criança Mais Fotogênica do Brasil",
      url: getSiteUrl(),
    },
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildEventJsonLd(input: {
  name: string;
  description: string;
  year: number;
  startDate?: Date | null;
  endDate?: Date | null;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    startDate: input.startDate?.toISOString(),
    endDate: input.endDate?.toISOString() ?? input.startDate?.toISOString(),
    url: absoluteUrl(input.url ?? "/o-concurso"),
    image: absoluteUrl("/og-default.jpg"),
    organizer: {
      "@type": "Organization",
      name: "Concurso Criança Mais Fotogênica do Brasil",
      url: getSiteUrl(),
    },
    location: {
      "@type": "VirtualLocation",
      url: absoluteUrl("/inscricao"),
    },
    inLanguage: "pt-BR",
    isAccessibleForFree: false,
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/inscricao"),
      availability: "https://schema.org/InStock",
      validFrom: input.startDate?.toISOString(),
    },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
