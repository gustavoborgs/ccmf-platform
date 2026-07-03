const DEFAULT_UPSTREAM =
  "https://nevoa-manager-backend-9e27f965f73e.herokuapp.com/api/public/tracking/snippet.js";

function resolveUpstreamSnippetUrl(): URL {
  const raw =
    process.env.NEVOA_TRACKING_SNIPPET_UPSTREAM_URL ??
    process.env.NEXT_PUBLIC_NEVOA_TRACKING_SNIPPET_URL ??
    (process.env.NEVOA_MANAGER_BASE_URL
      ? `${process.env.NEVOA_MANAGER_BASE_URL.replace(/\/$/, "")}/public/tracking/snippet.js`
      : DEFAULT_UPSTREAM);

  return new URL(raw);
}

function buildUpstreamHeaders(request: Request, upstream: URL): Headers {
  const headers = new Headers(request.headers);
  const clientIp = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for");

  headers.set("host", upstream.host);
  headers.delete("cookie");
  headers.delete("content-length");
  headers.delete("connection");

  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  return headers;
}

function buildProxyResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);

  // fetch descomprime o body — estes headers do upstream não batem mais com o stream.
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  return headers;
}

async function proxySnippetRequest(request: Request) {
  const upstream = resolveUpstreamSnippetUrl();
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  const response = await fetch(upstream, {
    method: request.method,
    headers: buildUpstreamHeaders(request, upstream),
    body,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildProxyResponseHeaders(response),
  });
}

/** Proxy transparente do snippet Nevoa — repassa status, headers e body do upstream. */
export async function GET(request: Request) {
  return proxySnippetRequest(request);
}

export async function HEAD(request: Request) {
  return proxySnippetRequest(request);
}
