import Link from "next/link";
import { PartnerForm } from "@/modules/content/components/partner-form";
import { Card } from "@/shared/ui";

export default function NewPartnerPage() {
  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/parceiros"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para parceiros
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">Novo parceiro</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Cadastre a marca e envie o logo recortado no padrão 800x400px para manter a vitrine
          pública consistente.
        </p>
      </section>

      <Card className="p-5 sm:p-6">
        <PartnerForm />
      </Card>
    </div>
  );
}
