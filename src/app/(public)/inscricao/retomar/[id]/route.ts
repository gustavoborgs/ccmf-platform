import { NextResponse, type NextRequest } from "next/server";
import { resolveResumeLink } from "@/modules/registrations/service";
import { WIZARD_REF_COOKIE, WIZARD_REF_MAX_AGE_SECONDS } from "@/modules/registrations/wizard-cookie";
import { serializeWizardRef } from "@/modules/registrations/wizard-ref";

/**
 * Link permanente de retomada (WhatsApp/e-mail). Resolve o identificador
 * público e redireciona para o wizard com o ref assinado na URL (?ref=),
 * também salvo em cookie local para retomada em /inscricao.
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
    const response = NextResponse.redirect(new URL("/inscricao", origin));
    response.cookies.delete(WIZARD_REF_COOKIE);
    return response;
  }

  if (result.kind === "PRE_ACCOUNT") {
    return NextResponse.redirect(new URL(`/inscricao?lead=${result.leadId}`, origin));
  }

  if (result.kind === "WIZARD") {
    const ref = serializeWizardRef({
      guardianId: result.guardianId,
      registrationId: result.registrationId,
    });
    const response = NextResponse.redirect(
      new URL(`/inscricao?ref=${encodeURIComponent(ref)}`, origin),
    );
    response.cookies.set(WIZARD_REF_COOKIE, ref, {
      maxAge: WIZARD_REF_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const response = NextResponse.redirect(
    new URL(`/inscricao/confirmada?protocolo=${encodeURIComponent(result.protocol)}`, origin),
  );
  response.cookies.delete(WIZARD_REF_COOKIE);
  return response;
}
