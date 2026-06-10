import { NextResponse, type NextRequest } from "next/server";
import { createPresignedReadUrl } from "@/shared/integrations/s3/storage";

/**
 * Proxy de leitura para mídia em bucket S3 privado.
 * O banco continua guardando apenas storageKey; getPublicUrl() aponta para cá.
 */

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key?: string[] }> },
) {
  const { key: segments } = await context.params;
  const key = segments?.join("/") ?? "";

  if (!isSafeStorageKey(key)) {
    return NextResponse.json({ error: "invalid_media_path" }, { status: 400 });
  }

  const { url } = await createPresignedReadUrl(key);
  const s3Response = await fetch(url, { cache: "no-store" });

  if (!s3Response.ok || !s3Response.body) {
    return NextResponse.json(
      { error: s3Response.status === 404 ? "media_not_found" : "media_fetch_failed" },
      { status: s3Response.status },
    );
  }

  const headers = new Headers();
  const contentType = s3Response.headers.get("content-type");
  const contentLength = s3Response.headers.get("content-length");
  const etag = s3Response.headers.get("etag");
  const lastModified = s3Response.headers.get("last-modified");

  if (contentType) headers.set("content-type", contentType);
  if (contentLength) headers.set("content-length", contentLength);
  if (etag) headers.set("etag", etag);
  if (lastModified) headers.set("last-modified", lastModified);
  headers.set("cache-control", "private, max-age=300");

  return new Response(s3Response.body, {
    status: s3Response.status,
    headers,
  });
}

function isSafeStorageKey(key: string): boolean {
  if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) return false;

  return ["contests/", "partners/", "blog/"].some((prefix) => key.startsWith(prefix));
}
