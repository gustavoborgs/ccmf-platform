import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/shared/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/conta",
          "/conta/",
          "/api",
          "/api/",
          "/entrar",
          "/recuperar-senha",
          "/inscricao/retomar",
          "/inscricao/confirmada",
          "/ingest",
          "/ingest/",
        ],
      },
      // Bots de IA liberados explicitamente para GEO (citações em respostas generativas).
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
