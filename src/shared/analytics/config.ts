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
