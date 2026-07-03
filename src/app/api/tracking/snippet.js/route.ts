import { NextResponse } from "next/server";

const DEFAULT_UPSTREAM =
  "https://nevoa-manager-backend-9e27f965f73e.herokuapp.com/api/public/tracking/snippet.js";

const CACHE_SECONDS = 300;

function resolveUpstreamSnippetUrl(): string {
  if (process.env.NEVOA_TRACKING_SNIPPET_UPSTREAM_URL) {
    return process.env.NEVOA_TRACKING_SNIPPET_UPSTREAM_URL;
  }

  if (process.env.NEXT_PUBLIC_NEVOA_TRACKING_SNIPPET_URL) {
    return process.env.NEXT_PUBLIC_NEVOA_TRACKING_SNIPPET_URL;
  }

  const baseUrl = process.env.NEVOA_MANAGER_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}/public/tracking/snippet.js`;
  }

  return DEFAULT_UPSTREAM;
}

/**
 * Proxy first-party do snippet de tracking Nevoa.
 * O browser carrega `/api/tracking/snippet.js` no nosso domínio; o servidor busca o JS upstream.
 */
export async function GET() {
  const upstream = resolveUpstreamSnippetUrl();

  try {
    const response = await fetch(upstream, {
      next: { revalidate: CACHE_SECONDS },
      headers: { Accept: "application/javascript, text/javascript, */*" },
    });

    if (!response.ok) {
      console.error("[tracking/snippet] upstream error", upstream, response.status);
      return new NextResponse("// tracking snippet unavailable\n", {
        status: 502,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      });
    }

    const body = await response.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("[tracking/snippet] fetch failed", upstream, error);
    return new NextResponse("// tracking snippet unavailable\n", {
      status: 502,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  }
}
