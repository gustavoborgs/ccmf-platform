const POSTHOG_API_HOST = "us.i.posthog.com";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function buildPostHogUrl(request: Request, path: string[]): { hostname: string; url: URL } {
  const pathname = `/${path.join("/")}`;
  const url = new URL(request.url);

  url.protocol = "https";
  url.hostname = POSTHOG_API_HOST;
  url.port = "";
  url.pathname = pathname;

  return { hostname: POSTHOG_API_HOST, url };
}

function buildPostHogHeaders(request: Request, hostname: string): Headers {
  const headers = new Headers(request.headers);
  const clientIp = headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for");

  headers.set("host", hostname);
  headers.delete("cookie");
  headers.delete("content-length");
  headers.delete("connection");

  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  return headers;
}

function buildResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);

  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("transfer-encoding");

  return headers;
}

async function proxyPostHogRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const { hostname, url } = buildPostHogUrl(request, path);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  const response = await fetch(url, {
    method: request.method,
    headers: buildPostHogHeaders(request, hostname),
    body,
    redirect: "manual",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildResponseHeaders(response),
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyPostHogRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyPostHogRequest(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return proxyPostHogRequest(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return proxyPostHogRequest(request, context);
}
