import { Suspense } from "react";
import Script from "next/script";
import {
  GA_MEASUREMENT_ID,
  GA_STREAM_ID,
  GOOGLE_ADS_ID,
  getGtagPrimaryId,
} from "./config";
import {
  GoogleAnalyticsAutoEvents,
  GoogleAnalyticsPageViews,
} from "./google-tag-client";

export function GoogleTag() {
  const primaryId = getGtagPrimaryId();
  if (!primaryId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${
            GA_MEASUREMENT_ID
              ? `gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false,
            stream_id: '${GA_STREAM_ID}'
          });`
              : ""
          }
          ${
            GOOGLE_ADS_ID
              ? `gtag('config', '${GOOGLE_ADS_ID}', {
            send_page_view: false
          });`
              : ""
          }
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews />
      </Suspense>
      <GoogleAnalyticsAutoEvents />
    </>
  );
}
