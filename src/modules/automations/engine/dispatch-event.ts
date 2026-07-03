import { db } from "@/shared/db";
import { parseAutomationConfig, normalizePhone } from "../lib";
import type { AutomationEvent } from "../types";
import type { AutomationConfig } from "../types";
import type { RegistrationAutomationCandidate } from "./find-candidates";
import { automationRegistrationInclude } from "./registration-include";
import { buildTemplateVariables, resolveCandidateContext } from "./template-context";
import {
  prepareCandidateMessages,
  sendPreparedWhatsappBatch,
  upsertAutomationLog,
} from "./send-whatsapp";

export async function dispatchAutomationEvent(
  event: AutomationEvent,
  ctx: { registrationId: string },
): Promise<void> {
  const automations = await db.automation.findMany({
    where: { enabled: true, channel: "WHATSAPP" },
  });

  const registration = await db.registration.findUnique({
    where: { id: ctx.registrationId, deletedAt: null },
    include: automationRegistrationInclude,
  });
  if (!registration) return;

  const candidate: RegistrationAutomationCandidate = {
    subjectType: "REGISTRATION",
    subjectId: registration.id,
    registration,
    referenceAt: new Date(),
    recipientName: registration.participant.guardian.user.name,
    recipientPhone:
      registration.participant.guardian.whatsapp ?? registration.participant.guardian.user.phone,
  };

  for (const automation of automations) {
    let config: AutomationConfig;
    try {
      config = parseAutomationConfig(automation.config);
    } catch {
      continue;
    }

    if (config.trigger !== "EVENT" || config.event !== event) continue;

    const existingLog = await db.automationLog.findUnique({
      where: {
        automationId_subjectType_subjectId: {
          automationId: automation.id,
          subjectType: "REGISTRATION",
          subjectId: registration.id,
        },
      },
    });
    if (existingLog && existingLog.status !== "FAILED") continue;

    const now = new Date();
    const scheduledFor =
      config.delayHours > 0
        ? new Date(now.getTime() + config.delayHours * 60 * 60 * 1000)
        : now;

    if (config.delayHours > 0) {
      const phone = normalizePhone(candidate.recipientPhone);
      const context = resolveCandidateContext(candidate);
      const variables = buildTemplateVariables(config.templateBindings, context);

      if (!phone) {
        await upsertAutomationLog(automation.id, candidate, config, {
          status: "SKIPPED",
          recipientPhone: candidate.recipientPhone ?? "",
          payload: { reason: "missing_or_invalid_phone", event },
          error: "Telefone/WhatsApp ausente ou inválido.",
          scheduledFor,
        });
        continue;
      }

      await upsertAutomationLog(automation.id, candidate, config, {
        status: "PENDING",
        recipientPhone: phone,
        payload: { templateId: config.templateId, phone, variables, event, ...context },
        error: null,
        scheduledFor,
      });
      continue;
    }

    const { prepared, skipped } = await prepareCandidateMessages(automation.id, [candidate], config);
    if (skipped) continue;
    await sendPreparedWhatsappBatch(automation.id, config.templateId, prepared);
  }
}
