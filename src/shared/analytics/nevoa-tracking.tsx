"use client";

import { useEffect } from "react";
import { NEVOA_TRACKING_SNIPPET_URL, NEVOA_TRACKING_TENANT } from "./config";

const SCRIPT_ID = "nevoa-tracking-snippet";

/**
 * Carrega o snippet Nevoa só após o mount (client).
 * Evita que o script reescreva links do WhatsApp antes da hidratação do React
 * (wa.me → api.whatsapp.com + data-nevoa-*), o que gerava hydration mismatch.
 */
export function NevoaTracking() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = NEVOA_TRACKING_SNIPPET_URL;
    script.async = true;
    script.dataset.tenant = NEVOA_TRACKING_TENANT;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
