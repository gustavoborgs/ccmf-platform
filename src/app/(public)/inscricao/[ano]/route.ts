/**
 * Compatibilidade com links legados do site antigo, como /inscricao/2026.
 * O wizard atual resolve a edição ativa em /inscricao.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ano: string }> },
) {
  const { ano } = await params;

  if (!/^\d{4}$/.test(ano)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(null, {
    status: 308,
    headers: { Location: "/inscricao" },
  });
}
