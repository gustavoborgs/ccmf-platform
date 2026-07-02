import Script from "next/script";
import { NEVOA_TRACKING_SNIPPET_URL, NEVOA_TRACKING_TENANT } from "./config";

export function NevoaTracking() {
  if (!NEVOA_TRACKING_TENANT) return null;

  return (
    <Script
      src={NEVOA_TRACKING_SNIPPET_URL}
      data-tenant={NEVOA_TRACKING_TENANT}
      strategy="afterInteractive"
    />
  );
}
