import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { env } from "@/shared/env";
import { formatNevoaManagerError, nevoaManager } from "@/shared/integrations/nevoa-manager/client";
import { getAutomation, normalizePhone } from "../lib";
import {
  DEFAULT_REGISTRATION_RESUME_WHATSAPP_CONFIG,
  REGISTRATION_RESUME_WHATSAPP_TYPE,
} from "./constants";
import type { RegistrationResumeWorkerResult } from "./types";
import type { RunRegistrationResumeWorkerInput } from "./validators";

type ResumeCandidate = Awaited<ReturnType<typeof findResumeCandidates>>[number];

/**
 * Worker: WhatsApp de retomada de inscrição abandonada.
 * Spec: docs/modules/automations.md
 */
export async function runRegistrationResumeWhatsappAutomation(
  input: RunRegistrationResumeWorkerInput = {},
): Promise<RegistrationResumeWorkerResult> {
  const automation = await getAutomation(REGISTRATION_RESUME_WHATSAPP_TYPE);

  if (!automation.enabled) {
    return {
      ok: true,
      dryRun: false,
      eligible: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      batchId: null,
    };
  }

  const { templateId, delayHours, batchLimit } = automation.config;
  const now = new Date();
  const limit = input.limit ?? batchLimit;
  const candidates = await findResumeCandidates(automation.id, delayHours, now, limit);

  if (input.dryRun) {
    return {
      ok: true,
      dryRun: true,
      eligible: candidates.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      batchId: null,
    };
  }

  const prepared = [];
  let skipped = 0;

  for (const candidate of candidates) {
    const phone = normalizePhone(
      candidate.participant.guardian.whatsapp ?? candidate.participant.guardian.user.phone,
    );

    if (!phone) {
      skipped += 1;
      await upsertRegistrationResumeLog(automation.id, delayHours, candidate, {
        status: "SKIPPED",
        recipientPhone:
          candidate.participant.guardian.whatsapp ??
          candidate.participant.guardian.user.phone ??
          "",
        payload: { reason: "missing_or_invalid_phone" },
        error: "Telefone/WhatsApp ausente ou inválido.",
      });
      continue;
    }

    const resumeUrl = buildResumeUrl(candidate.protocol);
    const variables = [candidate.participant.guardian.user.name, resumeUrl];
    const log = await upsertRegistrationResumeLog(automation.id, delayHours, candidate, {
      status: "PENDING",
      recipientPhone: phone,
      payload: {
        templateId,
        phone,
        variables,
        resumeUrl,
      },
      error: null,
    });

    prepared.push({ logId: log.id, phone, variables });
  }

  if (!prepared.length) {
    return {
      ok: true,
      dryRun: false,
      eligible: candidates.length,
      sent: 0,
      skipped,
      failed: 0,
      batchId: null,
    };
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
      dryRun: false,
      eligible: candidates.length,
      sent: prepared.length,
      skipped,
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
      dryRun: false,
      eligible: candidates.length,
      sent: 0,
      skipped,
      failed: prepared.length,
      batchId: null,
      error: message,
    };
  }
}

async function findResumeCandidates(
  automationId: string,
  delayHours: number,
  now: Date,
  limit: number,
) {
  const cutoff = new Date(now.getTime() - delayHours * 60 * 60 * 1000);

  return db.registration.findMany({
    where: {
      status: { in: ["DRAFT", "PENDING_PAYMENT"] },
      deletedAt: null,
      createdAt: { lte: cutoff },
      OR: [
        { automationLogs: { none: { automationId } } },
        { automationLogs: { some: { automationId, status: "FAILED" } } },
      ],
    },
    include: {
      participant: {
        include: {
          guardian: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

function upsertRegistrationResumeLog(
  automationId: string,
  delayHours: number,
  candidate: ResumeCandidate,
  data: {
    status: "PENDING" | "SKIPPED";
    recipientPhone: string;
    payload: Prisma.InputJsonValue;
    error: string | null;
  },
) {
  return db.automationLog.upsert({
    where: {
      automationId_registrationId: {
        automationId,
        registrationId: candidate.id,
      },
    },
    create: {
      automationId,
      status: data.status,
      registrationId: candidate.id,
      recipientName: candidate.participant.guardian.user.name,
      recipientPhone: data.recipientPhone,
      scheduledFor: new Date(candidate.createdAt.getTime() + delayHours * 60 * 60 * 1000),
      payload: data.payload,
      error: data.error,
    },
    update: {
      status: data.status,
      recipientName: candidate.participant.guardian.user.name,
      recipientPhone: data.recipientPhone,
      payload: data.payload,
      error: data.error,
      externalBatchId: null,
      externalJobId: null,
      sentAt: null,
    },
  });
}

function buildResumeUrl(protocol: string): string {
  return new URL(
    `/inscricao/retomar/${encodeURIComponent(protocol)}`,
    env.NEXT_PUBLIC_APP_URL,
  ).toString();
}
