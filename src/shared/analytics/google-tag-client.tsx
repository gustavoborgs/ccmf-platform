"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GA_MEASUREMENT_ID } from "./config";
import { trackEvent, trackPageView } from "./events";

function getLinkLabel(anchor: HTMLAnchorElement): string {
  return anchor.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) || anchor.href;
}

export function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname) return;

    const path = search ? `${pathname}?${search}` : pathname;
    trackPageView(path, GA_MEASUREMENT_ID);
  }, [pathname, search]);

  return null;
}

export function GoogleAnalyticsAutoEvents() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const label = getLinkLabel(anchor);
      if (href === "/inscricao" || href.startsWith("/inscricao?")) {
        trackEvent("select_content", {
          content_type: "enrollment_cta",
          item_id: href,
          link_text: label,
        });
        return;
      }

      if (href.startsWith("tel:")) {
        trackEvent("contact_phone_click", { link_text: label });
        return;
      }

      if (href.startsWith("mailto:")) {
        trackEvent("contact_email_click", { link_text: label });
        return;
      }

      if (href.includes("wa.me") || href.includes("whatsapp")) {
        trackEvent("contact_whatsapp_click", { link_text: label });
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
