import Link from "next/link";
import { notFound } from "next/navigation";
import { RegistrationResumeWhatsappForm } from "@/modules/automations/registration-resume-whatsapp/components/form";
import { getAdminAutomationById } from "@/modules/automations/service";
import { AUTOMATION_CHANNEL_LABELS, AUTOMATION_TYPE_LABELS } from "@/modules/automations/types";
import { Card } from "@/shared/ui";
import { StatusBadge } from "../../_components/admin-ui";

export default async function AdminAutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const automation = await getAdminAutomationById(id);
  if (!automation) notFound();

  return (
    <div className="space-y-6">
      <section>
        <Link
          href="/admin/automacoes"
          className="text-sm font-bold text-accent-700 transition hover:text-accent-800"
        >
          ← Voltar para automações
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-primary-700">{automation.name}</h1>
          <StatusBadge tone={automation.enabled ? "success" : "neutral"}>
            {automation.enabled ? "Ativa" : "Desligada"}
          </StatusBadge>
        </div>
        <p className="mt-3 max-w-3xl text-ink-muted">
          {automation.description ?? AUTOMATION_TYPE_LABELS[automation.type]} ·{" "}
          {AUTOMATION_CHANNEL_LABELS[automation.channel]} · {automation._count.logs} disparo(s)
          registrado(s)
        </p>
      </section>

      <Card className="max-w-3xl p-6">
        <h2 className="text-xl font-extrabold text-primary-700">Configuração</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Parâmetros operacionais persistidos em `Automation.config`. O worker usa estes valores
          em runtime.
        </p>
        <div className="mt-5">
          {automation.type === "REGISTRATION_RESUME_WHATSAPP" ? (
            <RegistrationResumeWhatsappForm
              initial={{
                id: automation.id,
                enabled: automation.enabled,
                config: automation.config,
              }}
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Edição administrativa ainda não implementada para este tipo de automação.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
