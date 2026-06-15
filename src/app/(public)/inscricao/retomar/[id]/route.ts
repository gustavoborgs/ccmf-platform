import { NextResponse } from "next/server";
import { resolveResumeLink } from "@/modules/registrations/service";
import { WIZARD_REF_COOKIE, WIZARD_REF_MAX_AGE_SECONDS } from "@/modules/registrations/wizard-cookie";
import { serializeWizardRef } from "@/modules/registrations/wizard-ref";
import { env } from "@/shared/env";

function appUrl(path: string): string {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

/**
 * Link permanente de retomada (WhatsApp/e-mail). Resolve o identificador
 * público e redireciona para o wizard com o ref assinado na URL (?ref=),
 * também salvo em cookie local para retomada em /inscricao.
 * Spec: docs/modules/registrations.md
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await resolveResumeLink(id);

  if (!result) {
    const response = NextResponse.redirect(appUrl("/inscricao"));
    response.cookies.delete(WIZARD_REF_COOKIE);
    return response;
  }

  if (result.kind === "PRE_ACCOUNT") {
    return NextResponse.redirect(appUrl(`/inscricao?lead=${result.leadId}`));
  }

  if (result.kind === "WIZARD") {
    const ref = serializeWizardRef({
      guardianId: result.guardianId,
      registrationId: result.registrationId,
    });
    const response = NextResponse.redirect(appUrl(`/inscricao?ref=${encodeURIComponent(ref)}`));
    response.cookies.set(WIZARD_REF_COOKIE, ref, {
      maxAge: WIZARD_REF_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const response = NextResponse.redirect(
    appUrl(`/inscricao/confirmada?protocolo=${encodeURIComponent(result.protocol)}`),
  );
  response.cookies.delete(WIZARD_REF_COOKIE);
  return response;
}
