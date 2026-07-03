import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { buildAutomationLogWhere, parseAutomationConfig } from "./lib";
import type {
  AdminAutomationCreateInput,
  AdminAutomationLogFilters,
  AdminAutomationUpdateInput,
} from "./validators";

/**
 * Módulo Automations: API pública compartilhada e listagem de logs.
 * Spec: docs/modules/automations.md
 */

export { normalizePhone, parseAutomationConfig, getAutomationById } from "./lib";
export { dispatchAutomationEvent } from "./engine/dispatch-event";
export { runAutomationsWorker } from "./engine/run-worker";
export type { AutomationsWorkerResult } from "./engine/run-worker";

export async function listAdminAutomations() {
  const items = await db.automation.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { logs: true } } },
  });

  return items.map((automation) => ({
    ...automation,
    config: parseAutomationConfig(automation.config),
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
    config: parseAutomationConfig(automation.config),
  };
}

export async function createAdminAutomation(input: AdminAutomationCreateInput) {
  const config = parseAutomationConfig(input.config);

  return db.automation.create({
    data: {
      type: "WHATSAPP",
      name: input.name,
      description: input.description,
      channel: "WHATSAPP",
      enabled: input.enabled,
      config,
    },
  });
}

export async function updateAdminAutomation(id: string, input: AdminAutomationUpdateInput) {
  const automation = await db.automation.findUnique({ where: { id }, select: { id: true } });
  if (!automation) throw new Error("Automação não encontrada.");

  const config = parseAutomationConfig(input.config);

  return db.automation.update({
    where: { id },
    data: {
      enabled: input.enabled,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      config,
    },
  });
}

export async function deleteAdminAutomation(id: string) {
  const automation = await db.automation.findUnique({
    where: { id },
    include: { logs: { where: { status: "SENT" }, take: 1 } },
  });
  if (!automation) throw new Error("Automação não encontrada.");
  if (automation.logs.length > 0) {
    throw new Error("Não é possível excluir automação com disparos enviados.");
  }

  await db.automationLog.deleteMany({ where: { automationId: id } });
  return db.automation.delete({ where: { id } });
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
      lead: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: filters.pageSize,
  });

  return { items, pagination };
}
