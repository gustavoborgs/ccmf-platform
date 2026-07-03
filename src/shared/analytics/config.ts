export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-3687YJY9H0";

export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-938563684";

export const GA_STREAM_ID = "4347140559";

/** IDs ativos no gtag — eventos e page views são enviados para todos. */
export function getGtagDestinationIds(): string[] {
  return [GA_MEASUREMENT_ID, GOOGLE_ADS_ID].filter(Boolean);
}

export function getGtagPrimaryId(): string | null {
  return GA_MEASUREMENT_ID || GOOGLE_ADS_ID || null;
}

export const NEVOA_TRACKING_TENANT =
  process.env.NEXT_PUBLIC_NEVOA_TRACKING_TENANT ?? "1234";

/** Snippet first-party (proxy em `/api/tracking/snippet.js`) — evita bloqueio por adblock. */
export const NEVOA_TRACKING_SNIPPET_URL = "/api/tracking/snippet.js";
