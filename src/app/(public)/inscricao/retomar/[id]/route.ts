import { NextResponse, type NextRequest } from "next/server";
import { resolveResumeLink } from "@/modules/registrations/service";
import { serializeWizardRef } from "@/modules/registrations/wizard-ref";

/**
 * Link permanente de retomada (WhatsApp/e-mail). Resolve o identificador
 * público e redireciona para o wizard com o ref assinado na URL (?ref=) —
 * sem cookie. Spec: docs/modules/registrations.md
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
    const ref = serializeWizardRef({
      guardianId: result.guardianId,
      registrationId: result.registrationId,
    });
    return NextResponse.redirect(
      new URL(`/inscricao?ref=${encodeURIComponent(ref)}`, origin),
    );
  }

  return NextResponse.redirect(
    new URL(`/inscricao/confirmada?protocolo=${encodeURIComponent(result.protocol)}`, origin),
  );
}
