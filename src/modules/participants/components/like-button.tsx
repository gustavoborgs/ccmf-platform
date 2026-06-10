"use client";

import { Heart } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/shared/ui";
import { likeRegistrationAction } from "../actions";

/**
 * Curtida anônima (sem login). O servidor deduplica por fingerprint;
 * o localStorage só lembra o estado visual neste aparelho.
 */
const STORAGE_KEY = "ccmf:liked-registrations";

function readLikedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rememberLiked(registrationId: string) {
  try {
    const ids = new Set(readLikedIds());
    ids.add(registrationId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // melhor esforço — o servidor continua deduplicando
  }
}

export function LikeButton({
  registrationId,
  initialCount,
  participantName,
}: {
  registrationId: string;
  initialCount: number;
  participantName: string;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setLiked(readLikedIds().includes(registrationId));
  }, [registrationId]);

  function handleLike() {
    if (liked || pending) return;

    startTransition(async () => {
      const result = await likeRegistrationAction({ registrationId });
      if (!result.ok) return;

      setCount(result.likesCount);
      setLiked(true);
      setJustLiked(true);
      rememberLiked(registrationId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? `Você já curtiu ${participantName}` : `Curtir ${participantName}`}
      className={cn(
        "inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full font-display text-lg font-bold transition active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600",
        liked
          ? "border-2 border-accent-200 bg-accent-50 text-accent-700"
          : "bg-brand-gradient text-white shadow-brand hover:opacity-90",
        pending && "opacity-70",
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          "h-6 w-6 transition",
          liked && "fill-accent-600 text-accent-600",
          justLiked && "animate-bounce",
        )}
      />
      <span>{liked ? "Curtido" : "Curtir"}</span>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-sm tabular-nums",
          liked ? "bg-accent-100" : "bg-white/20",
        )}
      >
        {count.toLocaleString("pt-BR")}
      </span>
    </button>
  );
}
