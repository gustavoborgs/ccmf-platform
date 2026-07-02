import { Lock } from "lucide-react";
import { Button } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";

type LockedChapterProps = {
  chapterTitle: string;
  moduleTitle: string;
  /** Taxa da edição ativa; null quando inscrições estão fechadas. */
  registrationFeeCents: number | null;
};

/**
 * Bloqueio de capítulo para responsável sem inscrição paga na edição ativa.
 * Converte a curiosidade do clique em CTA de inscrição.
 */
export function LockedChapter({
  chapterTitle,
  moduleTitle,
  registrationFeeCents,
}: LockedChapterProps) {
  const registrationsOpen = registrationFeeCents !== null;

  return (
    <div className="mx-auto max-w-2xl rounded-bubble border border-primary-100 bg-surface-muted p-8 text-center sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <Lock aria-hidden className="h-6 w-6 text-primary-600" />
      </span>

      <p className="mt-6 font-display text-xs font-extrabold uppercase tracking-widest text-accent-700">
        {moduleTitle}
      </p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-primary-700 sm:text-3xl">
        {chapterTitle}
      </h1>

      <p className="mt-4 text-ink-muted">
        Este capítulo faz parte do treinamento completo, um curso avaliado em{" "}
        <strong className="text-primary-700">R$ 350</strong> que é liberado sem custo extra para
        quem tem inscrição confirmada na edição atual do concurso.
      </p>

      {registrationsOpen ? (
        <p className="mt-2 text-ink-muted">
          Inscreva sua criança por{" "}
          <strong className="text-primary-700">{formatCentsBRL(registrationFeeCents)}</strong> e
          destrave todos os capítulos assim que o pagamento for confirmado.
        </p>
      ) : (
        <p className="mt-2 text-ink-muted">
          As inscrições desta edição estão fechadas. Fique de olho para garantir sua vaga na
          próxima.
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {registrationsOpen && (
          <Button href="/inscricao" size="lg">
            Fazer inscrição e destravar
          </Button>
        )}
        <Button href="/conta/formacao" variant="outline" size="lg">
          Ver módulos liberados
        </Button>
      </div>
    </div>
  );
}
