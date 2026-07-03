import Link from "next/link";
import { AutomationForm } from "@/modules/automations/components/automation-form";
import { Card } from "@/shared/ui";

export default function AdminAutomationCreatePage() {
  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/automacoes"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para automações
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold text-primary-700">Nova automação</h1>
        <p className="mt-3 max-w-3xl text-ink-muted">
          Configure uma regra de WhatsApp por etapa do funil (agendada) ou por evento do sistema.
        </p>
      </section>

      <Card className="max-w-3xl p-6">
        <AutomationForm mode="create" />
      </Card>
    </div>
  );
}
