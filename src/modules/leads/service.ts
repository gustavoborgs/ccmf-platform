import { db } from "@/shared/db";

/**
 * Módulo Leads: captura de abandono PRÉ-CONTA.
 * Spec: docs/modules/leads.md
 *
 * Após a conta existir, o funil de vendas é derivado de Registration
 * (getEnrollmentFunnel) — nada é duplicado aqui. Lead só cobre quem
 * preencheu o step 1 do wizard e não concluiu o cadastro.
 */

/**
 * Captura progressiva no step 1 (ex.: blur do e-mail/CPF no frontend).
 * Identifica por CPF ou e-mail do responsável, o que chegar primeiro.
 */
export async function captureLead(params: {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  source?: string;
}) {
  const email = params.email?.toLowerCase();
  if (!email && !params.cpf) {
    throw new Error("Lead precisa de e-mail ou CPF.");
  }

  const existing = await db.lead.findFirst({
    where: {
      OR: [
        ...(params.cpf ? [{ cpf: params.cpf }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (existing) {
    if (existing.stage !== "NEW") return existing;
    return db.lead.update({
      where: { id: existing.id },
      data: {
        name: params.name ?? existing.name,
        email: email ?? existing.email,
        cpf: params.cpf ?? existing.cpf,
        phone: params.phone ?? existing.phone,
      },
    });
  }

  return db.lead.create({
    data: { name: params.name, email, cpf: params.cpf, phone: params.phone, source: params.source },
  });
}

/** Conta criada → lead vira CONVERTED e sai do funil de recuperação. */
export async function convertLead(params: {
  email?: string;
  cpf?: string;
  guardianUserId: string;
}) {
  const email = params.email?.toLowerCase();
  const lead = await db.lead.findFirst({
    where: {
      stage: "NEW",
      OR: [
        ...(params.cpf ? [{ cpf: params.cpf }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
  });
  if (!lead) return null;

  const [updated] = await db.$transaction([
    db.lead.update({
      where: { id: lead.id },
      data: { stage: "CONVERTED", guardianUserId: params.guardianUserId, convertedAt: new Date() },
    }),
    db.leadEvent.create({
      data: { leadId: lead.id, type: "converted", metadata: { guardianUserId: params.guardianUserId } },
    }),
  ]);
  return updated;
}

/** Descarte manual pelo admin (com nota de motivo). */
export async function markLeadLost(leadId: string, note: string) {
  const [updated] = await db.$transaction([
    db.lead.update({
      where: { id: leadId },
      data: { stage: "LOST", lostAt: new Date(), notes: note },
    }),
    db.leadEvent.create({ data: { leadId, type: "lost", metadata: { note } } }),
  ]);
  return updated;
}

/**
 * Coluna pré-conta do board do CRM (`/admin/leads`).
 * As demais colunas vêm de `getEnrollmentFunnel` (registrations) — a página
 * admin compõe os dois services, evitando dependência circular entre módulos.
 */
export function listPreAccountLeads() {
  return db.lead.findMany({ where: { stage: "NEW" }, orderBy: { updatedAt: "desc" } });
}
