import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/shared/ui";

export type ParticipantCardData = {
  year: number;
  slug: string;
  /** nome já no formato público (primeiro nome + sobrenome) */
  name: string;
  categoryName: string;
  city: string;
  state: string;
  likesCount: number;
  photoUrl: string | null;
  badge: { label: string; tone: "winner" | "semifinalist" } | null;
};

/**
 * Card da galeria pública. Mobile-first: o card inteiro é o alvo de toque
 * e leva ao perfil do participante.
 */
export function ParticipantCard({ participant }: { participant: ParticipantCardData }) {
  return (
    <Link
      href={`/participantes/${participant.year}/${participant.slug}`}
      className="group relative block overflow-hidden rounded-bubble bg-primary-50 shadow-brand transition hover:-translate-y-1 hover:shadow-brand-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
    >
      <div className="relative aspect-[3/4]">
        {participant.photoUrl ? (
          <Image
            src={participant.photoUrl}
            alt={`Foto de ${participant.name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">📷</div>
        )}

        <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {participant.badge && (
          <span
            className={cn(
              "absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wide shadow-sm sm:left-3 sm:top-3",
              participant.badge.tone === "winner"
                ? "bg-amber-400 text-amber-950"
                : "bg-info-400 text-white",
            )}
          >
            {participant.badge.tone === "winner" ? (
              <Trophy className="h-3 w-3" aria-hidden />
            ) : (
              <Sparkles className="h-3 w-3" aria-hidden />
            )}
            {participant.badge.label}
          </span>
        )}

        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-accent-700 shadow-sm backdrop-blur sm:right-3 sm:top-3">
          <Heart className="h-3.5 w-3.5 fill-accent-600 text-accent-600" aria-hidden />
          {participant.likesCount.toLocaleString("pt-BR")}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
          <h3 className="font-display text-base font-extrabold leading-tight sm:text-lg">
            {participant.name}
          </h3>
          <p className="mt-0.5 text-xs text-white/85 sm:text-sm">
            {participant.categoryName} · {participant.city}/{participant.state}
          </p>
        </div>
      </div>
    </Link>
  );
}
