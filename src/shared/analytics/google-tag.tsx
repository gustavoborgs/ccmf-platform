import { Suspense } from "react";
import Script from "next/script";
import { GA_MEASUREMENT_ID, GA_STREAM_ID } from "./config";
import {
  GoogleAnalyticsAutoEvents,
  GoogleAnalyticsPageViews,
} from "./google-tag-client";

export function GoogleTag() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false,
            stream_id: '${GA_STREAM_ID}'
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews />
      </Suspense>
      <GoogleAnalyticsAutoEvents />
    </>
  );
}
