import { NextResponse } from "next/server";
import { runAutomationsWorker } from "@/modules/automations/service";
import { runAutomationsWorkerSchema } from "@/modules/automations/validators";
import { env } from "@/shared/env";

export const dynamic = "force-dynamic";

/**
 * Worker de automações agendadas (SCHEDULED) e logs pendentes.
 * Chamada esperada por scheduler externo via POST com Bearer/x-worker-token.
 * Spec: docs/modules/automations.md
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const input = runAutomationsWorkerSchema.parse(body);
  const result = await runAutomationsWorker(input);

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

function isAuthorized(request: Request): boolean {
  if (!env.AUTOMATION_WORKER_TOKEN) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  const token = request.headers.get("x-worker-token") ?? bearer;

  return token === env.AUTOMATION_WORKER_TOKEN;
}
