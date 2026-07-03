import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { automationConfigSchema } from "./validators";
import type { AutomationConfig } from "./types";
import type { AutomationTemplateVariable } from "./types";

function normalizeLegacyAutomationConfig(config: unknown): unknown {
  if (!config || typeof config !== "object") return config;
  const record = config as Record<string, unknown>;
  if (Array.isArray(record.templateBindings)) return config;
  if (!Array.isArray(record.templateVariables)) return config;

  return {
    ...record,
    templateBindings: (record.templateVariables as AutomationTemplateVariable[]).map(
      (variable, index) => ({
        variable,
        position: index + 1,
      }),
    ),
  };
}

export async function getAutomationById(id: string) {
  const automation = await db.automation.findUnique({ where: { id } });
  if (!automation) {
    throw new Error(`Automação não encontrada: ${id}.`);
  }

  return {
    ...automation,
    config: parseAutomationConfig(automation.config),
  };
}

export function parseAutomationConfig(config: unknown): AutomationConfig {
  return automationConfigSchema.parse(normalizeLegacyAutomationConfig(config));
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return `+${digits}`;

  return null;
}

export function buildAutomationLogWhere(
  filters: {
    automationId?: string;
    status?: Prisma.EnumAutomationStatusFilter["equals"];
    q?: string;
  },
): Prisma.AutomationLogWhereInput {
  const where: Prisma.AutomationLogWhereInput = {};
  if (filters.automationId) where.automationId = filters.automationId;
  if (filters.status) where.status = filters.status;

  if (filters.q) {
    const digits = filters.q.replace(/\D/g, "");
    where.OR = [
      { recipientName: { contains: filters.q, mode: "insensitive" } },
      { registration: { protocol: { contains: filters.q, mode: "insensitive" } } },
      {
        registration: {
          participant: { name: { contains: filters.q, mode: "insensitive" } },
        },
      },
      {
        registration: {
          participant: {
            guardian: {
              user: {
                OR: [
                  { name: { contains: filters.q, mode: "insensitive" } },
                  { email: { contains: filters.q, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      },
      { lead: { name: { contains: filters.q, mode: "insensitive" } } },
      { lead: { email: { contains: filters.q, mode: "insensitive" } } },
      ...(digits ? [{ recipientPhone: { contains: digits } }] : []),
    ];
  }

  return where;
}
