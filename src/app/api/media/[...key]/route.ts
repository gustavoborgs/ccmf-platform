import { NextResponse, type NextRequest } from "next/server";
import { getMediaCachePolicy, type MediaCachePolicy } from "@/modules/media/service";
import { createPresignedReadUrl } from "@/shared/integrations/s3/storage";

/**
 * Proxy de leitura para mídia em bucket S3 privado.
 * O banco continua guardando apenas storageKey; getPublicUrl() aponta para cá.
 */

const CACHE_CONTROL_BY_POLICY: Record<MediaCachePolicy, string> = {
  "public-photo": "public, max-age=31536000, s-maxage=31536000, immutable",
  "public-asset": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  private: "private, max-age=300, stale-while-revalidate=3600",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key?: string[] }> },
) {
  const { key: segments } = await context.params;
  const key = segments?.join("/") ?? "";

  if (!isSafeStorageKey(key)) {
    return NextResponse.json({ error: "invalid_media_path" }, { status: 400 });
  }

  const [cachePolicy, { url }] = await Promise.all([
    getMediaCachePolicy(key),
    createPresignedReadUrl(key),
  ]);
  const s3Response = await fetch(url, { cache: "no-store" });

  if (!s3Response.ok || !s3Response.body) {
    return NextResponse.json(
      { error: s3Response.status === 404 ? "media_not_found" : "media_fetch_failed" },
      { status: s3Response.status, headers: { "cache-control": "no-store" } },
    );
  }

  const headers = new Headers();
  const contentType = s3Response.headers.get("content-type");
  const contentLength = s3Response.headers.get("content-length");
  const etag = s3Response.headers.get("etag");
  const lastModified = s3Response.headers.get("last-modified");
  const acceptRanges = s3Response.headers.get("accept-ranges");

  if (contentType) headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);
  if (etag) headers.set("etag", etag);
  if (lastModified) headers.set("last-modified", lastModified);
  if (acceptRanges) headers.set("accept-ranges", acceptRanges);
  headers.set("cache-control", CACHE_CONTROL_BY_POLICY[cachePolicy]);

  return new Response(s3Response.body, {
    status: s3Response.status,
    headers,
  });
}

function isSafeStorageKey(key: string): boolean {
  if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) return false;

  return ["contests/", "partners/", "blog/"].some((prefix) => key.startsWith(prefix));
}
