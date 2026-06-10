import Link from "next/link";
import { ContestForm } from "@/modules/contests/components/contest-form";
import { Card } from "@/shared/ui";

export default function NewContestPage() {
  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/concursos"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para edições
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">Nova edição</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Crie a edição do ano com nome e taxa de inscrição. Depois de criada, você cadastra as
          categorias (faixas etárias) e abre as inscrições na tela de gestão.
        </p>
      </section>

      <Card className="max-w-3xl p-6">
        <ContestForm />
      </Card>
    </div>
  );
}
