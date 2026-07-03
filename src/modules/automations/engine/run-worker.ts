import { db } from "@/shared/db";
import { parseAutomationConfig } from "../lib";
import type { RunAutomationsWorkerInput } from "../validators";
import { findScheduledCandidates } from "./find-candidates";
import { prepareCandidateMessages, sendPreparedWhatsappBatch } from "./send-whatsapp";

export type AutomationsWorkerResult = {
  ok: boolean;
  dryRun: boolean;
  processedAutomations: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  pendingProcessed: number;
  batchId: string | null;
  error?: string;
};

export async function runAutomationsWorker(
  input: RunAutomationsWorkerInput = {},
): Promise<AutomationsWorkerResult> {
  const automations = await db.automation.findMany({
    where: { enabled: true, channel: "WHATSAPP" },
    orderBy: { name: "asc" },
  });

  let eligible = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let processedAutomations = 0;
  let lastBatchId: string | null = null;
  let lastError: string | undefined;
  const now = new Date();

  for (const automation of automations) {
    let config;
    try {
      config = parseAutomationConfig(automation.config);
    } catch {
      continue;
    }

    if (config.trigger !== "SCHEDULED") continue;
    processedAutomations += 1;

    const limit = input.limit ?? config.batchLimit;
    const candidates = await findScheduledCandidates(automation.id, config, now, limit);
    eligible += candidates.length;

    if (input.dryRun) continue;

    const { prepared, skipped: localSkipped } = await prepareCandidateMessages(
      automation.id,
      candidates,
      config,
    );
    skipped += localSkipped;

    if (!prepared.length) continue;

    const result = await sendPreparedWhatsappBatch(automation.id, config.templateId, prepared);
    sent += result.sent;
    failed += result.failed;
    if (result.batchId) lastBatchId = result.batchId;
    if (result.error) lastError = result.error;
  }

  let pendingProcessed = 0;
  if (!input.dryRun) {
    pendingProcessed = await processPendingLogs(now);
    sent += pendingProcessed;
  }

  return {
    ok: !lastError,
    dryRun: Boolean(input.dryRun),
    processedAutomations,
    eligible,
    sent,
    skipped,
    failed,
    pendingProcessed,
    batchId: lastBatchId,
    error: lastError,
  };
}

async function processPendingLogs(now: Date): Promise<number> {
  const pendingLogs = await db.automationLog.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
    },
    include: {
      automation: { select: { id: true, config: true, enabled: true } },
    },
    orderBy: { scheduledFor: "asc" },
    take: 50,
  });

  let sent = 0;

  for (const log of pendingLogs) {
    if (!log.automation.enabled) continue;

    const payload = log.payload as {
      templateId?: string;
      phone?: string;
      variables?: string[];
    } | null;

    if (!payload?.templateId || !payload.phone || !payload.variables) continue;

    const result = await sendPreparedWhatsappBatch(log.automation.id, payload.templateId, [
      { logId: log.id, phone: payload.phone, variables: payload.variables },
    ]);

    sent += result.sent;
  }

  return sent;
}
