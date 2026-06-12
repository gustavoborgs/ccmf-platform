"use client";

import { Check, Share2 } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { cn } from "@/shared/ui";

/**
 * Compartilhamento mobile-first: usa o Web Share API nativo (WhatsApp,
 * Instagram, etc.); no desktop cai para copiar o link.
 */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        posthog.capture("participant_shared", { method: "native_share", url });
        return;
      } catch {
        // usuário cancelou o share — não fazer nada
        return;
      }
    }

    await navigator.clipboard.writeText(url);
    posthog.capture("participant_shared", { method: "clipboard_copy", url });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full border-2 border-accent-600 px-6 py-3.5 font-display text-lg font-bold leading-none text-accent-600 transition hover:bg-accent-50 active:scale-[0.97] sm:flex-1",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
      )}
    >
      {copied ? <Check className="h-6 w-6" aria-hidden /> : <Share2 className="h-6 w-6" aria-hidden />}
      <span>{copied ? "Link copiado!" : "Compartilhar"}</span>
    </button>
  );
}
