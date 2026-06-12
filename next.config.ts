import type { NextConfig } from "next";

/** Host público das imagens (S3/CDN) — fotos dos participantes. */
function s3RemotePattern() {
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (!publicUrl) return [];
  const { protocol, hostname, port } = new URL(publicUrl);
  return [
    {
      protocol: protocol.replace(":", "") as "http" | "https",
      hostname,
      ...(port ? { port } : {}),
    },
  ];
}

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      ...s3RemotePattern(),
    ],
  },
};

export default nextConfig;
