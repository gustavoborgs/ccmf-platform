import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { formatNevoaManagerError, nevoaManager } from "@/shared/integrations/nevoa-manager/client";
import { normalizePhone } from "../lib";
import type { AutomationConfig } from "../types";
import type { AutomationCandidate } from "./find-candidates";
import { buildTemplateVariables, resolveCandidateContext } from "./template-context";

type PreparedMessage = {
  logId: string;
  phone: string;
  variables: string[];
};

export async function upsertAutomationLog(
  automationId: string,
  candidate: AutomationCandidate,
  config: AutomationConfig,
  data: {
    status: "PENDING" | "SKIPPED";
    recipientPhone: string;
    payload: Prisma.InputJsonValue;
    error: string | null;
    scheduledFor?: Date;
  },
) {
  const registrationId = candidate.subjectType === "REGISTRATION" ? candidate.subjectId : null;
  const leadId = candidate.subjectType === "LEAD" ? candidate.subjectId : null;

  return db.automationLog.upsert({
    where: {
      automationId_subjectType_subjectId: {
        automationId,
        subjectType: candidate.subjectType,
        subjectId: candidate.subjectId,
      },
    },
    create: {
      automationId,
      subjectType: candidate.subjectType,
      subjectId: candidate.subjectId,
      registrationId,
      leadId,
      status: data.status,
      recipientName: candidate.recipientName,
      recipientPhone: data.recipientPhone,
      scheduledFor: data.scheduledFor ?? candidate.referenceAt,
      payload: data.payload,
      error: data.error,
    },
    update: {
      status: data.status,
      recipientName: candidate.recipientName,
      recipientPhone: data.recipientPhone,
      scheduledFor: data.scheduledFor ?? candidate.referenceAt,
      payload: data.payload,
      error: data.error,
      externalBatchId: null,
      externalJobId: null,
      sentAt: null,
    },
  });
}

export async function sendPreparedWhatsappBatch(
  automationId: string,
  templateId: string,
  prepared: PreparedMessage[],
) {
  if (!prepared.length) {
    return { ok: true, sent: 0, failed: 0, batchId: null as string | null, error: undefined };
  }

  try {
    const response = await nevoaManager.sendTemplateBatch({
      items: prepared.map((item) => ({
        templateId,
        phone: item.phone,
        variables: item.variables,
      })),
    });

    const sentAt = new Date();
    await Promise.all(
      prepared.map((item, index) =>
        db.automationLog.update({
          where: { id: item.logId },
          data: {
            status: "SENT",
            externalBatchId: response.batch_id,
            externalJobId: response.jobIds[index] ?? null,
            sentAt,
            error: null,
          },
        }),
      ),
    );

    return {
      ok: response.ok,
      sent: prepared.length,
      failed: 0,
      batchId: response.batch_id,
    };
  } catch (error) {
    const message = formatNevoaManagerError(error);
    await Promise.all(
      prepared.map((item) =>
        db.automationLog.update({
          where: { id: item.logId },
          data: { status: "FAILED", error: message },
        }),
      ),
    );

    return {
      ok: false,
      sent: 0,
      failed: prepared.length,
      batchId: null,
      error: message,
    };
  }
}

export async function prepareCandidateMessages(
  automationId: string,
  candidates: AutomationCandidate[],
  config: AutomationConfig,
): Promise<{ prepared: PreparedMessage[]; skipped: number }> {
  const prepared: PreparedMessage[] = [];
  let skipped = 0;

  for (const candidate of candidates) {
    const phone = normalizePhone(candidate.recipientPhone);
    const context = resolveCandidateContext(candidate);
    const variables = buildTemplateVariables(config.templateBindings, context);

    if (!phone) {
      skipped += 1;
      await upsertAutomationLog(automationId, candidate, config, {
        status: "SKIPPED",
        recipientPhone: candidate.recipientPhone ?? "",
        payload: { reason: "missing_or_invalid_phone", templateId: config.templateId, variables },
        error: "Telefone/WhatsApp ausente ou inválido.",
      });
      continue;
    }

    const log = await upsertAutomationLog(automationId, candidate, config, {
      status: "PENDING",
      recipientPhone: phone,
      payload: { templateId: config.templateId, phone, variables, ...context },
      error: null,
    });

    prepared.push({ logId: log.id, phone, variables });
  }

  return { prepared, skipped };
}
