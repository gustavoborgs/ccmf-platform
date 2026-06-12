import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const POSTHOG_API_HOST = "us.i.posthog.com";
const POSTHOG_ASSETS_HOST = "us-assets.i.posthog.com";
const POSTHOG_PROXY_PREFIX = "/ingest";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const isAssetRequest =
    url.pathname.startsWith(`${POSTHOG_PROXY_PREFIX}/static/`) ||
    url.pathname.startsWith(`${POSTHOG_PROXY_PREFIX}/array/`);
  const hostname = isAssetRequest ? POSTHOG_ASSETS_HOST : POSTHOG_API_HOST;
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("host", hostname);
  url.protocol = "https";
  url.hostname = hostname;
  url.port = "";
  url.pathname = url.pathname.replace(new RegExp(`^${POSTHOG_PROXY_PREFIX}`), "");

  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: "/ingest/:path*",
};
