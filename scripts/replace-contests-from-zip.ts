import "dotenv/config";

import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import yauzl from "yauzl";

type ZipEntry = {
  fileName: string;
  uncompressedSize: number;
};

const options = parseArgs(process.argv.slice(2));
const execute = Boolean(options.execute);
const zipKey = options.zipKey ?? process.env.CONTESTS_ZIP_KEY ?? "contests.zip";
const targetPrefix = normalizePrefix(options.targetPrefix ?? process.env.CONTESTS_TARGET_PREFIX ?? "contests");
const sourceRoot = normalizeOptionalPrefix(
  options.sourceRoot ?? process.env.CONTESTS_ZIP_SOURCE_ROOT ?? "",
);
const tempDir = path.join(tmpdir(), "ccmf-contests-zip");
const tempZipPath = path.join(tempDir, path.basename(zipKey));

const client = new S3Client({
  region: requireEnv("S3_REGION"),
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: {
    accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
  },
});

async function main() {
  const bucket = requireEnv("S3_BUCKET");
  await mkdir(tempDir, { recursive: true });

  console.log(`Baixando s3://${bucket}/${zipKey}...`);
  await downloadObject(bucket, zipKey, tempZipPath);

  const entries = await listZipEntries(tempZipPath);
  const uploadEntries = entries.filter((entry) => shouldUploadEntry(entry.fileName));
  if (uploadEntries.length === 0) {
    throw new Error(`Nenhum arquivo encontrado no zip com sourceRoot="${sourceRoot ?? "(raiz)"}".`);
  }

  const currentKeys = await listKeys(bucket, targetPrefix);
  const totalBytes = uploadEntries.reduce((sum, entry) => sum + entry.uncompressedSize, 0);

  console.log(
    [
      `Zip: ${entries.length} entradas, ${uploadEntries.length} arquivos para upload`,
      `Destino: s3://${bucket}/${targetPrefix}`,
      `Objetos atuais no destino: ${currentKeys.length}`,
      `Tamanho descompactado: ${formatBytes(totalBytes)}`,
      execute ? "Modo: EXECUTE (vai apagar e substituir)" : "Modo: DRY-RUN (nada será alterado)",
    ].join("\n"),
  );

  if (!execute) {
    console.log("\nPara executar de verdade, rode novamente com --execute.");
    return;
  }

  console.log(`Apagando prefixo atual ${targetPrefix}...`);
  await deleteKeys(bucket, currentKeys);

  console.log("Enviando arquivos do zip...");
  await uploadZipEntries(bucket, tempZipPath, uploadEntries);

  await rm(tempZipPath, { force: true });
  console.log("Substituição concluída.");
}

function parseArgs(argv: string[]) {
  const parsed: Record<string, string | undefined> = {};
  for (const arg of argv) {
    if (arg === "--execute") {
      parsed.execute = "true";
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=", 2);
    parsed[key] = value ?? "true";
  }
  return parsed;
}

async function downloadObject(bucket: string, key: string, destination: string) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error(`Objeto sem Body: s3://${bucket}/${key}`);
  await pipeline(response.Body as Readable, createWriteStream(destination));
}

async function listZipEntries(zipPath: string): Promise<ZipEntry[]> {
  const zip = await openZip(zipPath);
  const entries: ZipEntry[] = [];

  return new Promise((resolve, reject) => {
    zip.readEntry();
    zip.on("entry", (entry) => {
      entries.push({
        fileName: entry.fileName,
        uncompressedSize: entry.uncompressedSize,
      });
      zip.readEntry();
    });
    zip.on("end", () => resolve(entries));
    zip.on("error", reject);
  });
}

async function uploadZipEntries(bucket: string, zipPath: string, entries: ZipEntry[]) {
  const zip = await openZip(zipPath);
  const allowed = new Set(entries.map((entry) => entry.fileName));
  let uploaded = 0;

  await new Promise<void>((resolve, reject) => {
    zip.readEntry();
    zip.on("entry", (entry) => {
      if (!allowed.has(entry.fileName)) {
        zip.readEntry();
        return;
      }

      zip.openReadStream(entry, async (error, stream) => {
        if (error || !stream) {
          reject(error ?? new Error(`Falha ao ler ${entry.fileName}`));
          return;
        }

        try {
          const key = destinationKey(entry.fileName);
          const body = await readStreamToBuffer(stream);
          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: body,
              ContentLength: body.length,
              ContentType: contentTypeFromPath(key),
            }),
          );
          uploaded += 1;
          if (uploaded === 1 || uploaded % 250 === 0 || uploaded === entries.length) {
            console.log(`Upload ${uploaded}/${entries.length}: ${key}`);
          }
          zip.readEntry();
        } catch (uploadError) {
          reject(uploadError);
        }
      });
    });
    zip.on("end", resolve);
    zip.on("error", reject);
  });
}

async function readStreamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function openZip(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) reject(error ?? new Error("Falha ao abrir zip."));
      else resolve(zip);
    });
  });
}

async function listKeys(bucket: string, prefix: string) {
  const keys: string[] = [];
  let ContinuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken,
      }),
    );
    for (const object of response.Contents ?? []) {
      if (object.Key) keys.push(object.Key);
    }
    ContinuationToken = response.NextContinuationToken;
  } while (ContinuationToken);

  return keys;
}

async function deleteKeys(bucket: string, keys: string[]) {
  for (let index = 0; index < keys.length; index += 1000) {
    const chunk = keys.slice(index, index + 1000);
    if (chunk.length === 0) continue;
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
    console.log(`Apagados ${Math.min(index + chunk.length, keys.length)}/${keys.length}`);
  }
}

function shouldUploadEntry(fileName: string) {
  if (fileName.endsWith("/")) return false;
  if (fileName.includes("__MACOSX/")) return false;
  if (path.basename(fileName).startsWith(".")) return false;
  return sourceRoot ? fileName.startsWith(sourceRoot) : true;
}

function destinationKey(fileName: string) {
  const relative = sourceRoot ? fileName.slice(sourceRoot.length).replace(/^\/+/, "") : fileName;
  if (!relative || relative.includes("..")) {
    throw new Error(`Caminho inválido no zip: ${fileName}`);
  }
  return `${targetPrefix}${relative}`;
}

function normalizePrefix(value: string) {
  return `${value.replace(/^\/+|\/+$/g, "")}/`;
}

function normalizeOptionalPrefix(value: string | undefined) {
  if (!value || value === "." || value === "/") return null;
  return normalizePrefix(value);
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada.`);
  return value;
}

function contentTypeFromPath(filePath: string) {
  const ext = filePath.toLowerCase().split(".").pop();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  return "image/jpeg";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
