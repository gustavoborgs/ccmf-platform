"use client";

import { useEffect } from "react";
import { trackInscricaoConfirmadaOnce } from "@/shared/analytics/events";

export function InscricaoConfirmadaTracker({ protocol }: { protocol: string }) {
  useEffect(() => {
    trackInscricaoConfirmadaOnce({ protocol });
  }, [protocol]);

  return null;
}
