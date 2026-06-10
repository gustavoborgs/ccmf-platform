import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/shared/env";

/**
 * Camada de storage (S3 ou compatível). Spec: docs/integrations/s3.md
 * Regras:
 * - O banco guarda apenas a `storageKey`, nunca URLs completas.
 * - Upload do browser sempre via presigned URL (a foto não passa pelo servidor Next).
 */
let client: S3Client | null = null;

function s3(): S3Client {
  client ??= new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

const PRESIGN_EXPIRES_SECONDS = 60 * 5;
const PRESIGN_READ_EXPIRES_SECONDS = 60;

export function buildPhotoKey(params: {
  contestYear: number;
  registrationId: string;
  fileName: string;
}): string {
  const ext = params.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  return `contests/${params.contestYear}/registrations/${params.registrationId}/${crypto.randomUUID()}.${ext}`;
}

export function buildContestFrameKey(contestYear: number): string {
  return `contests/${contestYear}/frame.png`;
}

export async function createPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
  return { uploadUrl, key };
}

export async function createPresignedReadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });
  const url = await getSignedUrl(s3(), command, { expiresIn: PRESIGN_READ_EXPIRES_SECONDS });
  return { url, key };
}

export function getPublicUrl(key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `/api/media/${encodedKey}`;
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
