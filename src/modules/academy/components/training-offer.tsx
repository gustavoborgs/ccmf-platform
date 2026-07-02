import { BookOpen, CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui";
import { formatCentsBRL } from "@/shared/utils";

type TrainingOfferProps = {
  /** Taxa da edição ativa; null quando inscrições estão fechadas. */
  registrationFeeCents: number | null;
  totalChapters: number;
  totalReadingMinutes: number;
};

const OFFER_BULLETS = [
  "27 capítulos práticos assinados pela Claudia Cavalcante",
  "Método POFIA para decidir como gestor, não por impulso",
  "Valores reais de mercado: cachês, comissões e custos por fase",
  "Como identificar golpes e propostas que exploram famílias",
  "Modelos prontos: dossiê do talento, plano 30/60/90 e checklists",
  "Proteção da infância em primeiro lugar, sem promessa de fama",
];

/**
 * Seção de oferta exibida para responsáveis sem inscrição paga.
 * O treinamento é apresentado como bônus incluso na inscrição da edição ativa.
 */
export function TrainingOffer({
  registrationFeeCents,
  totalChapters,
  totalReadingMinutes,
}: TrainingOfferProps) {
  const registrationsOpen = registrationFeeCents !== null;
  const feeLabel = registrationsOpen ? formatCentsBRL(registrationFeeCents) : null;
  const readingHours = Math.max(1, Math.round(totalReadingMinutes / 60));

  return (
    <section
      id="oferta"
      className="scroll-mt-24 overflow-hidden rounded-bubble border border-accent-200 bg-gradient-to-br from-primary-700 to-primary-600 p-8 text-white shadow-brand sm:p-12"
    >
      <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 font-display text-xs font-extrabold uppercase tracking-widest">
        <Lock aria-hidden className="h-3.5 w-3.5" />
        Conteúdo exclusivo para inscritos
      </p>

      <h2 className="mt-6 max-w-2xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">
        Destrave o treinamento completo com a inscrição do seu filho
      </h2>

      <p className="mt-4 max-w-2xl text-white/85">
        O curso completo de gestão de carreira infantil, escrito pela fundadora Claudia
        Cavalcante, custa <strong className="text-white">R$ 350</strong>. Para quem se
        inscreve no Concurso Criança Mais Fotogênica desta edição, ele fica gratuito após a
        confirmação da inscrição. São {totalChapters} capítulos e mais de {readingHours}{" "}
        horas de conteúdo para você conduzir a jornada do seu filho com segurança.
      </p>

      <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        {OFFER_BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-white/90">
            <CheckCircle2 aria-hidden className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-300" />
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-start gap-6 rounded-bubble bg-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/70 line-through">Valor do curso R$ 350,00</p>
          {registrationsOpen ? (
            <p className="mt-1 font-display text-2xl font-extrabold">
              {/* Grátis para quem se inscreve por {feeLabel} */}
              Grátis para todos os participantes
            </p>
          ) : (
            <p className="mt-1 font-display text-xl font-extrabold">
              Inscrições da próxima edição em breve
            </p>
          )}
          <p className="mt-1 text-sm text-white/70">
            Acesso liberado automaticamente após a confirmação do pagamento.
          </p>
        </div>

        {registrationsOpen ? (
          <Button href="/inscricao" size="lg" className="shrink-0">
            Inscrever e destravar o curso
          </Button>
        ) : (
          <Button href="/contato" variant="outline" size="lg" className="shrink-0">
            Avise-me quando abrir
          </Button>
        )}
      </div>

      <div className="mt-8 grid gap-4 text-sm text-white/75 sm:grid-cols-3">
        <p className="flex items-start gap-2">
          <BookOpen aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Leia no celular, no seu ritmo, quantas vezes quiser
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Sem promessa de fama: método, critério e proteção da infância
        </p>
        <p className="flex items-start gap-2">
          <Sparkles aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Módulo de boas-vindas liberado para você experimentar agora
        </p>
      </div>
    </section>
  );
}
