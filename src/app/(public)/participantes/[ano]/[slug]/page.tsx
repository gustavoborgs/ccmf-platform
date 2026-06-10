import { ChevronLeft, MapPin, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LikeButton } from "@/modules/participants/components/like-button";
import { PhotoCarousel } from "@/modules/participants/components/photo-carousel";
import { ShareButton } from "@/modules/participants/components/share-button";
import { publicDisplayName, publicStatusBadge } from "@/modules/participants/format";
import { getPublicParticipant } from "@/modules/participants/service";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { formatAgeRange } from "@/shared/utils";
import { Button, Container, cn } from "@/shared/ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ano: string; slug: string }>;
};

const loadParticipant = cache(async (ano: string, slug: string) => {
  const year = Number.parseInt(ano, 10);
  if (!Number.isInteger(year)) return null;
  return getPublicParticipant(year, slug);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ano, slug } = await params;
  const registration = await loadParticipant(ano, slug);
  if (!registration) return { title: "Participante não encontrado" };

  const name = publicDisplayName(registration.participant.name);
  const cover = registration.photos[0];
  const title = `${name} — Participantes ${registration.contest.year}`;
  const description =
    `Conheça ${name}, categoria ${registration.category.name}, de ` +
    `${registration.participant.city}/${registration.participant.state}, no ` +
    `Concurso Criança Mais Fotogênica ${registration.contest.year}. ` +
    "Curta a foto e compartilhe!";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      images: cover
        ? [
            {
              url: getPublicUrl(cover.storageKey),
              width: cover.width ?? undefined,
              height: cover.height ?? undefined,
              alt: `Foto de ${name}`,
            },
          ]
        : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ParticipantProfilePage({ params }: PageProps) {
  const { ano, slug } = await params;
  const registration = await loadParticipant(ano, slug);
  if (!registration) notFound();

  const { participant, category, contest } = registration;
  const name = publicDisplayName(participant.name);
  const badge = publicStatusBadge(registration.status, participant.gender);
  const photos = registration.photos.map((photo) => ({
    id: photo.id,
    url: getPublicUrl(photo.storageKey),
  }));
  const frameUrl = contest.frameImageKey ? getPublicUrl(contest.frameImageKey) : null;

  return (
    <>
      <section className="py-6 sm:py-10">
        <Container>
          <Link
            href={`/participantes/${contest.year}`}
            className="inline-flex items-center gap-1 font-display text-sm font-bold text-accent-700 transition hover:text-accent-600"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Participantes {contest.year}
          </Link>

          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-14">
            <div className="mx-auto w-full max-w-md lg:sticky lg:top-24">
              <PhotoCarousel photos={photos} frameUrl={frameUrl} alt={name} />
            </div>

            <div className="mx-auto w-full max-w-md lg:max-w-none">
              {badge && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 font-display text-xs font-bold uppercase tracking-wide",
                    badge.tone === "winner"
                      ? "bg-amber-400 text-amber-950"
                      : "bg-info-400 text-white",
                  )}
                >
                  {badge.label} · {contest.year}
                </span>
              )}

              <h1 className={cn("text-balance text-3xl font-extrabold sm:text-4xl", badge && "mt-3")}>
                <span className="text-brand-gradient">{name}</span>
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-ink-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-accent-600" aria-hidden />
                  {category.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-accent-600" aria-hidden />
                  {participant.city}/{participant.state}
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LikeButton
                  registrationId={registration.id}
                  initialCount={registration.likesCount}
                  participantName={name}
                />
                <ShareButton
                  title={`${name} — Criança Mais Fotogênica ${contest.year}`}
                  text={`Conheça ${name} no Concurso Criança Mais Fotogênica ${contest.year}. Curta a foto e compartilhe!`}
                />
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                Curta a foto e compartilhe com a família — não precisa de cadastro.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-bubble border border-primary-100 bg-white p-4">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                    Categoria
                  </dt>
                  <dd className="mt-1 font-display font-bold text-primary-700">{category.name}</dd>
                  <dd className="text-xs text-ink-muted">
                    {formatAgeRange(category.minAgeMonths, category.maxAgeMonths)}
                  </dd>
                </div>
                <div className="rounded-bubble border border-primary-100 bg-white p-4">
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                    Edição
                  </dt>
                  <dd className="mt-1 font-display font-bold text-primary-700">{contest.year}</dd>
                  <dd className="text-xs text-ink-muted">{contest.name}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="rounded-bubble bg-brand-gradient px-6 py-10 text-center text-white sm:px-10">
            <h2 className="mx-auto max-w-2xl text-2xl font-extrabold sm:text-3xl">
              Sua criança também pode brilhar aqui
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Inscreva sua criança no maior concurso de fotografia infantil do Brasil.
            </p>
            <Button
              href="/inscricao"
              variant="secondary"
              size="lg"
              className="mt-6 bg-white text-accent-700 hover:bg-accent-50"
            >
              Fazer inscrição
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
