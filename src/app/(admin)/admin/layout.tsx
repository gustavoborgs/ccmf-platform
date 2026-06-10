import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/modules/auth/actions";
import { requireRole } from "@/modules/auth/guards";
import { Button } from "@/shared/ui";
import { AdminNav } from "./_components/admin-nav";

/** Área autenticada — renderização só em runtime (sessão + banco). */
export const dynamic = "force-dynamic";

/**
 * Shell administrativo. O layout centraliza o guard para todas as rotas /admin.
 * Specs: docs/modules/auth.md e specs dos módulos administrativos.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-primary-50/40">
      <header className="sticky top-0 z-40 border-b border-primary-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="font-display text-xl font-extrabold text-primary-700">
            CCMF Admin
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-ink-muted sm:inline">
              {user.name}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-bubble border border-primary-100 bg-white p-4 shadow-brand lg:sticky lg:top-24 lg:self-start">
          <AdminNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
