"use client";

import { type MouseEvent, useEffect, useState } from "react";
import { buildWhatsAppUrl } from "@/shared/contact";
import { cn } from "@/shared/ui";

const WHATSAPP_MESSAGE =
  "Olá! Vim pelo site do CCMF e gostaria de falar com um especialista sobre a inscrição.";
const LABEL_TEXT = "Falar com especialista";
const LABEL_DELAY_MS = 4000;

export function WhatsAppFloat() {
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowLabel(true), LABEL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function handleDismiss(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setShowLabel(false);
  }

  return (
    <div className="fixed bottom-5 right-4 z-[60] flex items-center gap-2 sm:bottom-6 sm:right-6">
      {showLabel && (
        <button
          type="button"
          aria-label="Dispensar balão de atendimento"
          onClick={handleDismiss}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-brand transition hover:bg-white hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-3.5 w-3.5">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}

      <a
        href={buildWhatsAppUrl(WHATSAPP_MESSAGE)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={LABEL_TEXT}
        className={cn(
          "group relative flex items-center rounded-full bg-[#25D366] font-semibold text-white shadow-[0_10px_30px_-6px_rgb(37_211_102/0.6)] transition-all duration-500 hover:bg-[#1ebe5a] hover:shadow-[0_14px_36px_-6px_rgb(37_211_102/0.7)]",
          showLabel ? "gap-3 py-2.5 pl-2.5 pr-4" : "h-16 w-16 justify-center p-0",
        )}
      >
        <span className="relative flex h-12 w-12 items-center justify-center">
          {!showLabel && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-60" />
          )}
          <svg viewBox="0 0 32 32" fill="currentColor" className="relative h-8 w-8" aria-hidden="true">
            <path d="M16.004 3C9.383 3 4 8.383 4 15.004c0 2.118.557 4.18 1.615 6.002L4 29l8.18-2.146a11.94 11.94 0 0 0 3.824.626h.001C22.626 27.48 28 22.097 28 15.476 28 8.855 22.626 3 16.004 3Zm0 21.81h-.001a9.9 9.9 0 0 1-5.043-1.382l-.362-.215-4.854 1.274 1.296-4.73-.236-.374a9.86 9.86 0 0 1-1.51-5.205c0-5.477 4.457-9.934 9.94-9.934 2.654 0 5.148 1.035 7.025 2.913a9.86 9.86 0 0 1 2.91 7.027c0 5.477-4.457 9.934-9.93 9.934Zm5.452-7.44c-.299-.15-1.767-.872-2.04-.972-.274-.1-.473-.149-.673.15-.199.298-.772.971-.946 1.17-.174.199-.349.224-.647.075-.299-.15-1.262-.465-2.403-1.483-.888-.792-1.488-1.77-1.662-2.069-.174-.298-.019-.46.131-.609.135-.134.299-.349.448-.523.15-.174.199-.299.299-.498.1-.199.05-.374-.025-.523-.075-.15-.673-1.622-.922-2.221-.243-.583-.49-.504-.673-.513l-.573-.01c-.199 0-.523.075-.797.374-.274.299-1.046 1.022-1.046 2.494 0 1.472 1.071 2.894 1.22 3.093.15.199 2.107 3.218 5.105 4.513.714.308 1.27.492 1.704.63.716.228 1.368.196 1.883.119.574-.086 1.767-.722 2.016-1.42.249-.697.249-1.295.174-1.42-.075-.124-.274-.199-.573-.348Z" />
          </svg>
        </span>

        <span
          className={cn(
            "grid overflow-hidden whitespace-nowrap text-sm transition-[grid-template-columns,opacity,margin] duration-500 ease-out",
            showLabel ? "ml-0 mr-1 grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0",
          )}
        >
          <span className="min-w-0">{LABEL_TEXT}</span>
        </span>
      </a>
    </div>
  );
}
