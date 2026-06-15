import type { AutomationType, Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { registrationResumeWhatsappConfigSchema } from "./registration-resume-whatsapp/validators";
import type { AutomationConfig } from "./types";

export async function getAutomation<T extends AutomationType>(type: T) {
  const automation = await db.automation.findUnique({ where: { type } });
  if (!automation) {
    throw new Error(`Automação não configurada: ${type}.`);
  }

  return {
    ...automation,
    config: parseAutomationConfig(type, automation.config),
  };
}

export function parseAutomationConfig<T extends AutomationType>(
  type: T,
  config: unknown,
): AutomationConfig<T> {
  switch (type) {
    case "REGISTRATION_RESUME_WHATSAPP":
      return registrationResumeWhatsappConfigSchema.parse(config) as AutomationConfig<T>;
    default:
      throw new Error(`Parser de config não implementado para ${String(type)}.`);
  }
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
    type?: AutomationType;
    status?: Prisma.EnumAutomationStatusFilter["equals"];
    q?: string;
  },
): Prisma.AutomationLogWhereInput {
  const where: Prisma.AutomationLogWhereInput = {};
  if (filters.type) where.automation = { type: filters.type };
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
      ...(digits ? [{ recipientPhone: { contains: digits } }] : []),
    ];
  }

  return where;
}
