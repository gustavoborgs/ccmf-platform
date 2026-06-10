import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryManager, type CategoryRow } from "@/modules/contests/components/category-manager";
import { ContestForm } from "@/modules/contests/components/contest-form";
import { ContestStatusControl } from "@/modules/contests/components/contest-status-control";
import { contestStatusLabel, contestStatusTone } from "@/modules/contests/labels";
import { getAdminContestById } from "@/modules/contests/service";
import { getPublicUrl } from "@/shared/integrations/s3/storage";
import { Card } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";
import { StatusBadge } from "../../_components/admin-ui";

export default async function AdminContestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contest = await getAdminContestById(id);
  if (!contest) notFound();

  const categories: CategoryRow[] = contest.categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    minAgeMonths: category.minAgeMonths,
    maxAgeMonths: category.maxAgeMonths,
    order: category.order,
    registrationsCount: category._count.registrations,
  }));

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/concursos"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para edições
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-primary-700">
            {contest.name} · {contest.year}
          </h1>
          <StatusBadge tone={contestStatusTone(contest.status)}>
            {contestStatusLabel(contest.status)}
          </StatusBadge>
        </div>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Taxa de {formatCentsBRL(contest.registrationFeeCents)} ·{" "}
          {contest._count.registrations} inscrição(ões) · {categories.length} categoria(s)
        </p>
      </section>

      <Card className="p-6">
        <ContestStatusControl contestId={contest.id} status={contest.status} />
      </Card>

      <Card className="overflow-hidden p-0">
        <CategoryManager contestId={contest.id} categories={categories} />
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-extrabold text-primary-700">Dados da edição</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Ano, nome, taxa de inscrição, live de resultados, moldura e regulamento.
        </p>
        <div className="mt-5">
          <ContestForm
            initial={{
              id: contest.id,
              year: contest.year,
              name: contest.name,
              registrationFeeCents: contest.registrationFeeCents,
              revealAt: contest.revealAt,
              frameImageKey: contest.frameImageKey,
              frameImageUrl: contest.frameImageKey ? getPublicUrl(contest.frameImageKey) : null,
              regulationMd: contest.regulationMd,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
