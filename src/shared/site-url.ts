/**
 * URL canônica pública do site (SEO, sitemap, JSON-LD, Open Graph).
 * Padroniza em NEXT_PUBLIC_SITE_URL; faz fallback para APP_URL e, por último,
 * para o domínio de produção.
 */
const PRODUCTION_SITE_URL = "https://criancamaisfotogenica.com.br";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    PRODUCTION_SITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
