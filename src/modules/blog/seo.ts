import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { absoluteUrl as sharedAbsoluteUrl, getSiteUrl as sharedGetSiteUrl } from "@/shared/site-url";

export function getSiteUrl(): string {
  return sharedGetSiteUrl();
}

export function absoluteUrl(path: string): string {
  return sharedAbsoluteUrl(path);
}

export function postUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

export function mediaUrl(storageKey: string | null): string | null {
  if (!storageKey) return null;
  return absoluteUrl(getPublicUrl(storageKey));
}
