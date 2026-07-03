import { env } from "@/shared/env";
import type { AutomationTemplateBinding, AutomationTemplateVariable } from "../types";
import { sortTemplateBindings } from "../types";
import type { AutomationCandidate } from "./find-candidates";

const PUBLIC_PROFILE_STATUSES = new Set(["APPROVED", "SEMIFINALIST", "WINNER"]);

export type TemplateContext = Partial<Record<AutomationTemplateVariable, string>>;

export function buildAppUrl(path: string): string {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

export function buildResumeUrl(publicId: string): string {
  return buildAppUrl(`/inscricao/retomar/${encodeURIComponent(publicId)}`);
}

export function buildReferralUrl(referralCode: string): string {
  return buildAppUrl(`/inscricao?indicacao=${encodeURIComponent(referralCode)}`);
}

export function buildParticipantProfileUrl(year: number, slug: string, status: string): string {
  if (!PUBLIC_PROFILE_STATUSES.has(status)) return "";
  return buildAppUrl(`/participantes/${year}/${encodeURIComponent(slug)}`);
}

export function resolveCandidateContext(candidate: AutomationCandidate): TemplateContext {
  if (candidate.subjectType === "LEAD") {
    return {
      guardianName: candidate.recipientName,
      resumeUrl: buildResumeUrl(candidate.lead.id),
    };
  }

  const { registration } = candidate;
  const referralCode = registration.participant.guardian.referralCode;

  return {
    guardianName: candidate.recipientName,
    participantName: registration.participant.name,
    protocol: registration.protocol,
    categoryName: registration.category.name,
    contestYear: String(registration.contest.year),
    resumeUrl: buildResumeUrl(registration.protocol),
    participantProfileUrl: buildParticipantProfileUrl(
      registration.contest.year,
      registration.participant.slug,
      registration.status,
    ),
    referralCode,
    referralUrl: buildReferralUrl(referralCode),
    accountUrl: buildAppUrl("/conta"),
    trainingUrl: buildAppUrl("/conta/formacao"),
  };
}

export function buildTemplateVariables(
  bindings: AutomationTemplateBinding[],
  ctx: TemplateContext,
): string[] {
  return sortTemplateBindings(bindings).map((binding) => ctx[binding.variable] ?? "");
}
