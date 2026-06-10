import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/shared/ui";
import { ADMIN_NAV_GROUPS } from "./_components/admin-nav-data";

/**
 * Dashboard administrativo. Specs: docs/modules/contests.md, leads.md,
 * guardians.md, participants.md.
 */
export default async function AdminDashboardPage() {
  const items = ADMIN_NAV_GROUPS.flatMap((group) => group.items).filter(
    (item) => item.href !== "/admin",
  );
  const availableItems = items.filter((item) => item.status === "available");
  const plannedItems = items.filter((item) => item.status === "planned");

  return (
    <div className="space-y-8">
      <section className="rounded-bubble bg-brand-gradient p-8 text-white shadow-brand">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-white/80">
          Painel administrativo
        </p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Bem-vindo ao admin CCMF</h1>
        <p className="mt-3 max-w-2xl text-white/85">
          Use o menu lateral para acompanhar o funil de inscrições, revisar participantes,
          gerenciar concursos e preparar as próximas áreas operacionais.
        </p>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-primary-700">Áreas principais</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Opções já mapeadas nas specs para a operação do concurso.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {availableItems.map((item) => (
            <AdminShortcutCard key={item.href} href={item.href} title={item.label}>
              {item.description}
            </AdminShortcutCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold text-primary-700">Espaço para evoluções</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Entradas reservadas no menu para módulos planejados e futuras configurações.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {plannedItems.map((item) => (
            <AdminShortcutCard key={item.href} href={item.href} title={item.label} planned>
              {item.description}
            </AdminShortcutCard>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminShortcutCard({
  href,
  title,
  planned = false,
  children,
}: {
  href: string;
  title: string;
  planned?: boolean;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-accent-200">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-extrabold text-primary-700">{title}</h3>
          {planned && (
            <span className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-accent-700">
              Futuro
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-ink-muted">{children}</p>
      </Card>
    </Link>
  );
}
