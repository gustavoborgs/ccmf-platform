import type { ReactNode } from "react";
import { requireRole } from "@/modules/auth/guards";

/**
 * Área autenticada do responsável.
 * Todas as páginas filhas devem receber apenas dados do próprio GUARDIAN.
 */
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireRole("GUARDIAN");
  return children;
}
