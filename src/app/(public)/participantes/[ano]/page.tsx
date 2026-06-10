import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContestByYear } from "@/modules/contests/service";
import { GallerySearch } from "@/modules/participants/components/gallery-search";
import {
  ParticipantCard,
  type ParticipantCardData,
} from "@/modules/participants/components/participant-card";
import { publicDisplayName, publicStatusBadge } from "@/modules/participants/format";
import { listPublicParticipants, listPublicYears } from "@/modules/participants/service";
import { publicGalleryFiltersSchema } from "@/modules/participants/validators";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Button, Card, Container, cn } from "@/shared/ui";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ ano: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseYear(ano: string): number | null {
  const year = Number.parseInt(ano, 10);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
}

function galleryHref(year: number, query: { q?: string; categoria?: string }): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.categoria) params.set("categoria", query.categoria);
  const qs = params.toString();
  return `/participantes/${year}${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ano } = await params;
  return {
    title: `Participantes ${ano}`,
    description: `Galeria oficial dos participantes do Concurso Criança Mais Fotogênica ${ano}. Curta as fotos e compartilhe com a família.`,
  };
}

export default async function ParticipantsGalleryPage({ params, searchParams }: PageProps) {
  const { ano } = await params;
  const year = parseYear(ano);
  if (!year) notFound();

  const contest = await getContestByYear(year);
  if (!contest) notFound();

  const rawParams = await searchParams;
  const filters = publicGalleryFiltersSchema.parse({
    q: rawParams.q,
    categorySlug: rawParams.categoria,
  });

  const [registrations, years] = await Promise.all([
    listPublicParticipants(year, filters),
    listPublicYears(),
  ]);

  const cards: ParticipantCardData[] = registrations.map((registration) => ({
    year,
    slug: registration.participant.slug,
    name: publicDisplayName(registration.participant.name),
    categoryName: registration.category.name,
    city: registration.participant.city,
    state: registration.participant.state,
    likesCount: registration.likesCount,
    photoUrl: registration.photos[0] ? getPublicUrl(registration.photos[0].storageKey) : null,
    badge: publicStatusBadge(registration.status, registration.participant.gender),
  }));

  const hasFilters = Boolean(filters.q || filters.categorySlug);

  return (
    <>
      <section className="bg-brand-gradient text-white">
        <Container className="py-10 sm:py-14">
          <p className="mb-2 inline-block rounded-full bg-white/15 px-4 py-1 font-display text-sm font-bold uppercase tracking-widest">
            Galeria oficial
          </p>
          <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-5xl">
            Participantes {year}
          </h1>
          <p className="mt-3 max-w-2xl text-white/90 sm:text-lg">
            Conheça as crianças desta edição, curta as fotos e compartilhe com a
            família — cada perfil é um mini portfólio.
          </p>

          {years.length > 1 && (
            <nav aria-label="Edições" className="mt-6 flex flex-wrap gap-2">
              {years.map((availableYear) => (
                <Link
                  key={availableYear}
                  href={`/participantes/${availableYear}`}
                  className={cn(
                    "rounded-full px-4 py-1.5 font-display text-sm font-bold transition",
                    availableYear === year
                      ? "bg-white text-accent-700"
                      : "bg-white/15 text-white hover:bg-white/25",
                  )}
                >
                  {availableYear}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>

      <section className="sticky top-16 z-40 border-b border-primary-100 bg-surface/95 py-3 backdrop-blur">
        <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <GallerySearch initialQuery={filters.q} />

          {contest.categories.length > 0 && (
            <nav
              aria-label="Categorias"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <Link
                href={galleryHref(year, { q: filters.q })}
                className={cn(
                  "flex-none rounded-full border px-4 py-1.5 font-display text-sm font-bold transition",
                  !filters.categorySlug
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-primary-100 bg-white text-ink-muted hover:border-accent-300 hover:text-accent-700",
                )}
              >
                Todas
              </Link>
              {contest.categories.map((category) => (
                <Link
                  key={category.id}
                  href={galleryHref(year, { q: filters.q, categoria: category.slug })}
                  className={cn(
                    "flex-none rounded-full border px-4 py-1.5 font-display text-sm font-bold transition",
                    filters.categorySlug === category.slug
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-primary-100 bg-white text-ink-muted hover:border-accent-300 hover:text-accent-700",
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          )}
        </Container>
      </section>

      <section className="py-8 sm:py-12">
        <Container>
          {cards.length > 0 ? (
            <>
              <p className="mb-5 text-sm text-ink-muted">
                {cards.length === 1
                  ? "1 participante"
                  : `${cards.length.toLocaleString("pt-BR")} participantes`}
                {hasFilters && " com os filtros aplicados"} · ordenados por curtidas
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {cards.map((card) => (
                  <ParticipantCard key={`${card.year}-${card.slug}`} participant={card} />
                ))}
              </div>
            </>
          ) : (
            <Card className="mx-auto max-w-2xl py-12 text-center">
              <h2 className="font-display text-2xl font-extrabold text-primary-700">
                {hasFilters
                  ? "Nenhum participante encontrado"
                  : "Os participantes aparecerão em breve"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-ink-muted">
                {hasFilters
                  ? "Tente buscar por outro nome ou escolher outra categoria."
                  : "As inscrições aprovadas desta edição serão publicadas aqui."}
              </p>
              {hasFilters && (
                <Button href={`/participantes/${year}`} variant="outline" size="sm" className="mt-6">
                  Limpar filtros
                </Button>
              )}
            </Card>
          )}
        </Container>
      </section>

      <section className="pb-16">
        <Container>
          <div className="rounded-bubble bg-surface-muted px-6 py-10 text-center sm:px-10">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-700">
              Sua criança aqui
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-extrabold text-primary-700 sm:text-3xl">
              Inscreva sua criança e participe da próxima galeria
            </h2>
            <Button href="/inscricao" size="lg" className="mt-6">
              Fazer inscrição
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
