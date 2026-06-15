import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { buildAutomationLogWhere, parseAutomationConfig } from "./lib";
import type { AdminAutomationLogFilters, AdminAutomationUpdateInput } from "./validators";

/**
 * Módulo Automations: API pública compartilhada e listagem de logs.
 * Spec: docs/modules/automations.md
 *
 * Cada automação tem pasta própria com service dedicado.
 */

export { getAutomation, normalizePhone, parseAutomationConfig } from "./lib";
export { runRegistrationResumeWhatsappAutomation } from "./registration-resume-whatsapp/service";

export async function listAdminAutomations() {
  const items = await db.automation.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { logs: true } } },
  });

  return items.map((automation) => ({
    ...automation,
    config: parseAutomationConfig(automation.type, automation.config),
  }));
}

export async function getAdminAutomationById(id: string) {
  const automation = await db.automation.findUnique({
    where: { id },
    include: { _count: { select: { logs: true } } },
  });
  if (!automation) return null;

  return {
    ...automation,
    config: parseAutomationConfig(automation.type, automation.config),
  };
}

export async function updateAdminAutomation(id: string, input: AdminAutomationUpdateInput) {
  const automation = await db.automation.findUnique({ where: { id }, select: { id: true, type: true } });
  if (!automation) throw new Error("Automação não encontrada.");

  const config = parseAutomationConfig(automation.type, input.config);

  return db.automation.update({
    where: { id },
    data: { enabled: input.enabled, config },
  });
}

export async function listAutomationLogs(filters: AdminAutomationLogFilters) {
  const where = buildAutomationLogWhere(filters);
  const total = await db.automationLog.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.automationLog.findMany({
    where,
    include: {
      automation: { select: { id: true, type: true, name: true, channel: true } },
      registration: {
        select: {
          id: true,
          protocol: true,
          status: true,
          participant: {
            select: {
              name: true,
              guardian: { select: { user: { select: { name: true, email: true } } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: filters.pageSize,
  });

  return { items, pagination };
}
