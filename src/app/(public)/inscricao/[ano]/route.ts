import { NextResponse, type NextRequest } from "next/server";

/**
 * Compatibilidade com links legados do site antigo, como /inscricao/2026.
 * O wizard atual resolve a edição ativa em /inscricao.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ano: string }> },
) {
  const { ano } = await params;

  if (!/^\d{4}$/.test(ano)) {
    return new Response("Not found", { status: 404 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/inscricao";
  return NextResponse.redirect(url, 308);
}
