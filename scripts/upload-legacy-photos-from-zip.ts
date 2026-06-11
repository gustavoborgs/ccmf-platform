import "dotenv/config";

import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { HeadObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import yauzl from "yauzl";
import { PrismaClient } from "../src/generated/prisma/client";

type PhotoManifestEntry = {
  registrationId: string;
  legacyChildId: number;
  legacyInvoiceId: number | null;
  year: number;
  kind: "picture1" | "official" | "picture2" | "framed" | "frame";
  sourcePath: string;
  sourceUrl: string;
  targetStorageKey: string;
  order: number;
  isCover: boolean;
};

type ZipPathIndex = {
  byRelativePath: Map<string, string>;
  byBasename: Map<string, string[]>;
};

const DEFAULT_MANIFEST = path.join("docs", "legacy-import", "photos-manifest-full.json");

const options = parseArgs(process.argv.slice(2));
const execute = Boolean(options.execute);
const force = Boolean(options.force);
const zipKey = options.zipKey ?? process.env.CONTESTS_ZIP_KEY ?? "contests.zip";
const manifestPath = options.manifest ?? process.env.LEGACY_PHOTO_MANIFEST ?? DEFAULT_MANIFEST;
const zipSourceRoot = normalizeOptionalPrefix(options.zipSourceRoot ?? process.env.CONTESTS_ZIP_SOURCE_ROOT);
const offset = options.offset ? Number.parseInt(options.offset, 10) : 0;
const limit = options.limit ? Number.parseInt(options.limit, 10) : null;

const tempDir = path.join(tmpdir(), "ccmf-legacy-photos-zip");
const tempZipPath = path.join(tempDir, path.basename(zipKey));
const extractDir = path.join(tempDir, "extracted");

const client = new S3Client({
  region: requireEnv("S3_REGION"),
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: {
    accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
  },
});

let prisma: PrismaClient | null = null;

async function main() {
  const bucket = requireEnv("S3_BUCKET");
  const manifest = await loadManifest(manifestPath);
  const photoEntries = manifest.filter(
    (entry) => entry.registrationId && entry.kind !== "frame" && entry.targetStorageKey,
  );
  const selected = photoEntries.slice(offset, limit ? offset + limit : undefined);

  if (selected.length === 0) {
    throw new Error(`Nenhuma entrada no manifesto para offset=${offset} limit=${limit ?? "all"}.`);
  }

  await mkdir(tempDir, { recursive: true });
  console.log(`Baixando s3://${bucket}/${zipKey}...`);
  await downloadObject(bucket, zipKey, tempZipPath);

  console.log("Extraindo zip...");
  const zipIndex = await extractZip(tempZipPath, extractDir);

  console.log(
    [
      `Manifesto: ${manifest.length} entradas, ${photoEntries.length} fotos de inscrição`,
      `Lote: ${selected.length} (offset ${offset})`,
      `Zip indexado: ${zipIndex.byRelativePath.size} arquivos`,
      execute ? "Modo: EXECUTE" : "Modo: DRY-RUN",
      force ? "Force: sim (reupload mesmo se existir no S3)" : "Force: não",
    ].join("\n"),
  );

  if (!execute) {
    const sample = selected.slice(0, 5);
    for (const entry of sample) {
      const localPath = resolveLocalFile(entry.sourcePath, zipIndex);
      console.log(
        localPath
          ? `[ok] ${entry.sourcePath} -> ${entry.targetStorageKey}`
          : `[missing] ${entry.sourcePath} -> ${entry.targetStorageKey}`,
      );
    }
    console.log("\nPara executar de verdade, rode novamente com --execute.");
    return;
  }

  const db = getPrisma();
  let uploaded = 0;
  let skippedMissing = 0;
  let skippedExisting = 0;
  let photosCreated = 0;
  let photosUpdated = 0;
  let photosUnchanged = 0;

  for (const [index, entry] of selected.entries()) {
    const localPath = resolveLocalFile(entry.sourcePath, zipIndex);
    if (!localPath) {
      skippedMissing += 1;
      console.log(`Arquivo ausente no zip: ${entry.sourcePath}`);
      continue;
    }

    const body = await readFile(localPath);
    if (!isLikelyImage(body)) {
      skippedMissing += 1;
      console.log(`Conteúdo inválido (não é imagem): ${entry.sourcePath}`);
      continue;
    }

    const alreadyInS3 = await objectExists(bucket, entry.targetStorageKey);
    if (alreadyInS3 && !force) {
      skippedExisting += 1;
    } else {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: entry.targetStorageKey,
          Body: body,
          ContentLength: body.length,
          ContentType: contentTypeFromPath(entry.targetStorageKey),
        }),
      );
      uploaded += 1;
    }

    const syncResult = await syncPhotoRecord(db, entry);
    if (syncResult === "created") photosCreated += 1;
    else if (syncResult === "updated") photosUpdated += 1;
    else photosUnchanged += 1;

    const progress = index + 1;
    if (progress === 1 || progress % 100 === 0 || progress === selected.length) {
      console.log(`Progresso ${progress}/${selected.length}: ${entry.targetStorageKey}`);
    }
  }

  console.log(
    [
      `Upload S3: ${uploaded} enviados, ${skippedExisting} já existiam, ${skippedMissing} ausentes/inválidos`,
      `Banco: ${photosCreated} criados, ${photosUpdated} atualizados, ${photosUnchanged} inalterados`,
    ].join("\n"),
  );

  await rm(tempDir, { recursive: true, force: true });
}

function parseArgs(argv: string[]) {
  const parsed: Record<string, string | undefined> = {};
  for (const arg of argv) {
    if (arg === "--execute") {
      parsed.execute = "true";
      continue;
    }
    if (arg === "--force") {
      parsed.force = "true";
      continue;
    }
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=", 2);
    parsed[key] = value ?? "true";
  }
  return parsed;
}

async function loadManifest(filePath: string) {
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as PhotoManifestEntry[];
}

async function downloadObject(bucket: string, key: string, destination: string) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error(`Objeto sem Body: s3://${bucket}/${key}`);
  await pipeline(response.Body as Readable, createWriteStream(destination));
}

async function extractZip(zipPath: string, destination: string): Promise<ZipPathIndex> {
  await mkdir(destination, { recursive: true });
  const zip = await openZip(zipPath);
  const index: ZipPathIndex = {
    byRelativePath: new Map(),
    byBasename: new Map(),
  };

  await new Promise<void>((resolve, reject) => {
    zip.readEntry();
    zip.on("entry", (entry) => {
      if (entry.fileName.endsWith("/")) {
        zip.readEntry();
        return;
      }
      if (entry.fileName.includes("__MACOSX/") || path.basename(entry.fileName).startsWith(".")) {
        zip.readEntry();
        return;
      }

      zip.openReadStream(entry, async (error, stream) => {
        if (error || !stream) {
          reject(error ?? new Error(`Falha ao ler ${entry.fileName}`));
          return;
        }

        try {
          const relativePath = normalizeZipPath(entry.fileName);
          const outputPath = path.join(destination, relativePath);
          await mkdir(path.dirname(outputPath), { recursive: true });
          await pipeline(stream, createWriteStream(outputPath));
          index.byRelativePath.set(relativePath, outputPath);

          const basename = path.posix.basename(relativePath);
          const basenameMatches = index.byBasename.get(basename) ?? [];
          basenameMatches.push(outputPath);
          index.byBasename.set(basename, basenameMatches);

          zip.readEntry();
        } catch (extractError) {
          reject(extractError);
        }
      });
    });
    zip.on("end", resolve);
    zip.on("error", reject);
  });

  return index;
}

function resolveLocalFile(sourcePath: string, index: ZipPathIndex) {
  const normalizedSource = normalizeZipPath(sourcePath);
  const candidates = new Set<string>([
    normalizedSource,
    zipSourceRoot ? `${zipSourceRoot}${normalizedSource}` : "",
    `contest/${normalizedSource}`,
    `contests/${normalizedSource}`,
    `site/views/_data/concourses/${normalizedSource}`,
  ]);

  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = index.byRelativePath.get(candidate);
    if (match) return match;
  }

  for (const [relativePath, absolutePath] of index.byRelativePath) {
    if (relativePath.endsWith(`/${normalizedSource}`) || relativePath === normalizedSource) {
      return absolutePath;
    }
  }

  const basename = path.posix.basename(normalizedSource);
  const basenameMatches = index.byBasename.get(basename) ?? [];
  if (basenameMatches.length === 1) return basenameMatches[0];

  const suffixMatches = basenameMatches.filter((absolutePath) =>
    normalizeZipPath(absolutePath).endsWith(normalizedSource),
  );
  if (suffixMatches.length === 1) return suffixMatches[0];

  return null;
}

async function objectExists(bucket: string, key: string) {
  try {
    const response = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return (response.ContentLength ?? 0) > 512;
  } catch {
    return false;
  }
}

function isLikelyImage(body: Buffer) {
  if (body.length < 12) return false;
  if (body[0] === 0xff && body[1] === 0xd8) return true;
  if (body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47) return true;
  if (body[0] === 0x47 && body[1] === 0x49 && body[2] === 0x46) return true;
  if (body.slice(0, 4).toString("ascii") === "RIFF" && body.slice(8, 12).toString("ascii") === "WEBP") {
    return true;
  }
  return false;
}

async function syncPhotoRecord(db: PrismaClient, entry: PhotoManifestEntry) {
  const existingByKey = await db.photo.findFirst({
    where: {
      registrationId: entry.registrationId,
      storageKey: entry.targetStorageKey,
    },
    select: { id: true, order: true, isCover: true },
  });

  if (existingByKey) {
    if (existingByKey.order !== entry.order || existingByKey.isCover !== entry.isCover) {
      await db.photo.update({
        where: { id: existingByKey.id },
        data: { order: entry.order, isCover: entry.isCover },
      });
      return "updated" as const;
    }
    return "unchanged" as const;
  }

  const existingByOrder = await db.photo.findFirst({
    where: {
      registrationId: entry.registrationId,
      order: entry.order,
    },
    select: { id: true, storageKey: true, isCover: true },
  });

  if (existingByOrder) {
    if (existingByOrder.storageKey !== entry.targetStorageKey || existingByOrder.isCover !== entry.isCover) {
      await db.photo.update({
        where: { id: existingByOrder.id },
        data: {
          storageKey: entry.targetStorageKey,
          isCover: entry.isCover,
        },
      });
      return "updated" as const;
    }
    return "unchanged" as const;
  }

  await db.photo.create({
    data: {
      registrationId: entry.registrationId,
      storageKey: entry.targetStorageKey,
      order: entry.order,
      isCover: entry.isCover,
    },
  });
  return "created" as const;
}

function openZip(zipPath: string): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) reject(error ?? new Error("Falha ao abrir zip."));
      else resolve(zip);
    });
  });
}

function normalizeZipPath(value: string) {
  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function normalizeOptionalPrefix(value: string | undefined) {
  if (!value || value === "." || value === "/") return null;
  return `${value.replace(/^\/+|\/+$/g, "")}/`;
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
  if (ext === "jpeg" || ext === "jpg") return "image/jpeg";
  return "image/jpeg";
}

function getPrisma() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
  if (!prisma) {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

main().catch(async (error) => {
  console.error(error);
  if (existsSync(tempDir)) {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
  process.exit(1);
});
