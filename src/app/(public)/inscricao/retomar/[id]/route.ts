import { NextResponse, type NextRequest } from "next/server";
import { resolveResumeLink } from "@/modules/registrations/service";
import {
  serializeWizardSession,
  wizardCookieOptions,
} from "@/modules/registrations/wizard-session";

const COOKIE_NAME = "ccmf_wizard";

/**
 * Link permanente de retomada (WhatsApp/e-mail). Route handler (não página)
 * para setar o cookie no NextResponse antes do redirect 307 — cookies()
 * + redirect() do next/navigation não garantem persistência juntos.
 * Spec: docs/modules/registrations.md
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await resolveResumeLink(id);
  const origin = request.nextUrl.origin;

  if (!result) {
    return NextResponse.redirect(new URL("/inscricao", origin));
  }

  if (result.kind === "PRE_ACCOUNT") {
    return NextResponse.redirect(new URL(`/inscricao?lead=${result.leadId}`, origin));
  }

  if (result.kind === "WIZARD") {
    const response = NextResponse.redirect(new URL("/inscricao", origin));
    response.cookies.set(
      COOKIE_NAME,
      serializeWizardSession({
        guardianId: result.guardianId,
        registrationId: result.registrationId,
      }),
      wizardCookieOptions,
    );
    return response;
  }

  return NextResponse.redirect(
    new URL(`/inscricao/confirmada?protocolo=${encodeURIComponent(result.protocol)}`, origin),
  );
}
