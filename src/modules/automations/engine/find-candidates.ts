import type { Lead, Prisma, RegistrationStatus } from "@/generated/prisma/client";
import { deriveEnrollmentFunnelStep, deriveStepEnteredAt } from "@/modules/registrations/service";
import { listRecoverableLeads } from "@/modules/leads/service";
import { db } from "@/shared/db";
import type { AutomationConfig } from "../types";
import { automationRegistrationInclude } from "./registration-include";

type RegistrationCandidate = Awaited<
  ReturnType<typeof db.registration.findMany<{ include: typeof automationRegistrationInclude }>>
>[number];

export type LeadAutomationCandidate = {
  subjectType: "LEAD";
  subjectId: string;
  lead: Lead;
  referenceAt: Date;
  recipientName: string;
  recipientPhone: string | null;
};

export type RegistrationAutomationCandidate = {
  subjectType: "REGISTRATION";
  subjectId: string;
  registration: RegistrationCandidate;
  referenceAt: Date;
  recipientName: string;
  recipientPhone: string | null;
};

export type AutomationCandidate = LeadAutomationCandidate | RegistrationAutomationCandidate;

export async function findScheduledCandidates(
  automationId: string,
  config: Extract<AutomationConfig, { trigger: "SCHEDULED" }>,
  now: Date,
  limit: number,
): Promise<AutomationCandidate[]> {
  const cutoff = new Date(now.getTime() - config.delayHours * 60 * 60 * 1000);

  if (config.funnelStep === "PRE_ACCOUNT") {
    return findLeadCandidates(automationId, config, cutoff, limit);
  }

  const registrations = await findRegistrationCandidates(automationId, config, limit);
  const candidates: RegistrationAutomationCandidate[] = [];

  for (const registration of registrations) {
    const referenceAt = resolveRegistrationReferenceAt(registration, config);
    if (referenceAt > cutoff) continue;

    candidates.push({
      subjectType: "REGISTRATION",
      subjectId: registration.id,
      registration,
      referenceAt,
      recipientName: registration.participant.guardian.user.name,
      recipientPhone:
        registration.participant.guardian.whatsapp ?? registration.participant.guardian.user.phone,
    });
  }

  return candidates.slice(0, limit);
}

async function findLeadCandidates(
  automationId: string,
  config: Extract<AutomationConfig, { trigger: "SCHEDULED" }>,
  cutoff: Date,
  limit: number,
): Promise<LeadAutomationCandidate[]> {
  const leads = await listRecoverableLeads(limit * 3);
  const candidates: LeadAutomationCandidate[] = [];

  for (const lead of leads) {
    const referenceAt =
      config.delayAnchor === "STEP_ENTERED" ? lead.updatedAt : lead.createdAt;
    if (referenceAt > cutoff) continue;

    const existingLog = await db.automationLog.findUnique({
      where: {
        automationId_subjectType_subjectId: {
          automationId,
          subjectType: "LEAD",
          subjectId: lead.id,
        },
      },
    });
    if (existingLog && existingLog.status !== "FAILED") continue;

    candidates.push({
      subjectType: "LEAD",
      subjectId: lead.id,
      lead,
      referenceAt,
      recipientName: lead.name ?? "Responsável",
      recipientPhone: lead.phone,
    });

    if (candidates.length >= limit) break;
  }

  return candidates;
}

async function findRegistrationCandidates(
  automationId: string,
  config: Extract<AutomationConfig, { trigger: "SCHEDULED" }>,
  limit: number,
): Promise<RegistrationCandidate[]> {
  const statusWhere: Prisma.RegistrationWhereInput = config.statuses?.length
    ? { status: { in: config.statuses as RegistrationStatus[] } }
    : config.funnelStep === "PAYMENT_PENDING"
      ? { status: "PENDING_PAYMENT" }
      : config.funnelStep === "PENDING_PHOTOS" || config.funnelStep === "READY_FOR_CHECKOUT"
        ? { status: "DRAFT" }
        : { status: { in: ["DRAFT", "PENDING_PAYMENT"] } };

  const registrations = await db.registration.findMany({
    where: {
      AND: [
        statusWhere,
        { deletedAt: null },
        {
          OR: [
            { automationLogs: { none: { automationId } } },
            { automationLogs: { some: { automationId, status: "FAILED" } } },
          ],
        },
      ],
    },
    include: automationRegistrationInclude,
    orderBy: { createdAt: "asc" },
    take: limit * 5,
  });

  if (!config.funnelStep || config.statuses?.length) {
    return registrations;
  }

  return registrations.filter((registration) => {
    const step = deriveEnrollmentFunnelStep(registration);
    return step === config.funnelStep;
  });
}

function resolveRegistrationReferenceAt(
  registration: RegistrationCandidate,
  config: Extract<AutomationConfig, { trigger: "SCHEDULED" }>,
): Date {
  if (config.statuses?.length && config.funnelStep == null) {
    return registration.createdAt;
  }

  const step = deriveEnrollmentFunnelStep(registration);
  if (step === "PAYMENT_CONFIRMED") return registration.createdAt;

  return deriveStepEnteredAt(registration, step, config.delayAnchor);
}
