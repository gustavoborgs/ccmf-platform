"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** PageView em navegações client-side (a carga inicial já dispara no snippet). */
export function MetaPixelPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!pathname || !window.fbq) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.fbq("track", "PageView");
  }, [pathname, search]);

  return null;
}
