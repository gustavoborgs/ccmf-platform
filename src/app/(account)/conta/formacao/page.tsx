import Link from "next/link";
import { requireRole } from "@/modules/auth/guards";
import { getTrainingAccess } from "@/modules/registrations/service";
import {
  FREE_MODULE_SLUGS,
  getModuleIndex,
  getTrainingMeta,
} from "@/modules/academy/service";
import { ModuleIndex, TrainingHero, TrainingOffer } from "@/modules/academy/components";
import { Button, Container } from "@/shared/ui";

/**
 * Índice do treinamento premium na área do responsável.
 * Acesso completo só com inscrição paga na edição ativa; sem ela, a página
 * vira vitrine: módulo de boas-vindas liberado + oferta de inscrição.
 * Spec: docs/modules/academy.md
 */
export default async function AcademyIndexPage() {
  const user = await requireRole("GUARDIAN");
  const { hasAccess, registrationFeeCents } = await getTrainingAccess(user.id);

  const meta = getTrainingMeta();
  const modules = getModuleIndex();
  const firstChapter = modules[0]?.chapters[0];
  const lockedModuleSlugs = hasAccess
    ? []
    : modules.map((module) => module.slug).filter((slug) => !FREE_MODULE_SLUGS.includes(slug));

  return (
    <Container className="py-12">
      <div className="mb-6">
        <Button href="/conta" variant="ghost" size="sm">
          ← Voltar para minha conta
        </Button>
      </div>

      <TrainingHero meta={meta} />

      <div className="mt-10 flex flex-wrap gap-3">
        {firstChapter && (
          <Button href={`/conta/formacao/${firstChapter.slug}`} size="lg">
            {hasAccess ? "Começar pelo primeiro capítulo" : "Experimentar grátis o capítulo 1"}
          </Button>
        )}
        {hasAccess ? (
          <Button href="#modulos" variant="outline" size="lg">
            Ver todos os módulos
          </Button>
        ) : (
          <Button href="#oferta" variant="outline" size="lg">
            Como destravar o curso completo
          </Button>
        )}
      </div>

      {!hasAccess && (
        <div className="mt-10">
          <TrainingOffer
            registrationFeeCents={registrationFeeCents}
            totalChapters={meta.totalChapters}
            totalReadingMinutes={meta.totalReadingMinutes}
          />
        </div>
      )}

      <section id="modulos" className="mt-16 scroll-mt-24">
        <div className="mb-8">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-accent-700">
            Trilha completa
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-primary-700">
            Módulos e capítulos
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            {hasAccess
              ? "Siga a ordem na primeira leitura. Depois, use como consulta sempre que precisar tomar uma decisão sobre a jornada do seu filho."
              : "O módulo de boas-vindas está liberado para você conhecer o método da Claudia. Os demais são destravados com a inscrição confirmada."}
          </p>
        </div>

        <ModuleIndex modules={modules} lockedModuleSlugs={lockedModuleSlugs} />
      </section>

      <div className="mt-12 rounded-bubble border border-primary-100 bg-surface-muted p-6 text-center">
        <p className="text-sm text-ink-muted">
          Dúvidas sobre o conteúdo?{" "}
          <Link href="/contato" className="font-semibold text-accent-700 hover:underline">
            Fale conosco
          </Link>
        </p>
      </div>
    </Container>
  );
}
