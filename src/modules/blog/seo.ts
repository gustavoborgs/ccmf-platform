import { getPublicUrl } from "@/shared/integrations/s3/storage";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function postUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

export function mediaUrl(storageKey: string | null): string | null {
  if (!storageKey) return null;
  return absoluteUrl(getPublicUrl(storageKey));
}
