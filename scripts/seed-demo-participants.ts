import "dotenv/config";
import { deflateSync } from "node:zlib";
import bcrypt from "bcryptjs";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "../src/shared/db";
import { buildProtocol, slugify } from "../src/shared/utils";

/**
 * Dados de demonstração para a galeria pública de participantes:
 * cria um responsável demo, inscrições aprovadas no concurso 2026 e
 * fotos placeholder (PNG gerado) no MinIO local.
 *
 * Uso: npx tsx scripts/seed-demo-participants.ts
 */

const DEMO_EMAIL = "demo-participantes@ccmf.com.br";

type DemoKid = {
  name: string;
  gender: "MALE" | "FEMALE";
  ageMonths: number;
  city: string;
  state: string;
  status: "APPROVED" | "SEMIFINALIST" | "WINNER";
  likes: number;
  colors: [number, number, number][];
};

const KIDS: DemoKid[] = [
  { name: "Maria Clara dos Santos", gender: "FEMALE", ageMonths: 8, city: "Londrina", state: "PR", status: "WINNER", likes: 412, colors: [[236, 19, 128], [142, 24, 180]] },
  { name: "Theo Henrique Oliveira", gender: "MALE", ageMonths: 18, city: "Maringá", state: "PR", status: "SEMIFINALIST", likes: 318, colors: [[43, 196, 242], [196, 20, 160]] },
  { name: "Alice Ferreira Lima", gender: "FEMALE", ageMonths: 36, city: "Curitiba", state: "PR", status: "SEMIFINALIST", likes: 287, colors: [[251, 92, 171]] },
  { name: "Davi Lucca Pereira", gender: "MALE", ageMonths: 60, city: "Cascavel", state: "PR", status: "APPROVED", likes: 201, colors: [[81, 212, 251], [236, 19, 128]] },
  { name: "Helena Costa Ribeiro", gender: "FEMALE", ageMonths: 9, city: "São Paulo", state: "SP", status: "APPROVED", likes: 164, colors: [[173, 44, 217]] },
  { name: "Miguel Souza Almeida", gender: "MALE", ageMonths: 84, city: "Campinas", state: "SP", status: "APPROVED", likes: 122, colors: [[196, 20, 160], [43, 196, 242]] },
  { name: "Laura Martins Rocha", gender: "FEMALE", ageMonths: 132, city: "Florianópolis", state: "SC", status: "APPROVED", likes: 98, colors: [[236, 19, 128]] },
  { name: "Arthur Gomes Barbosa", gender: "MALE", ageMonths: 30, city: "Porto Alegre", state: "RS", status: "APPROVED", likes: 73, colors: [[142, 24, 180], [251, 92, 171]] },
  { name: "Valentina Cardoso Nunes", gender: "FEMALE", ageMonths: 15, city: "Belo Horizonte", state: "MG", status: "APPROVED", likes: 55, colors: [[17, 159, 212]] },
  { name: "Bernardo Dias Moreira", gender: "MALE", ageMonths: 150, city: "Rio de Janeiro", state: "RJ", status: "APPROVED", likes: 31, colors: [[236, 19, 128], [142, 24, 180]] },
];

// ── PNG gerado em memória (600x800, retrato 3:4) ────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** PNG 600x800 com gradiente vertical entre duas cores (ou cor sólida). */
function buildPng([r, g, b]: [number, number, number], to?: [number, number, number]): Buffer {
  const width = 600;
  const height = 800;
  const end = to ?? [r, g, b];

  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filtro: none
    const t = y / (height - 1);
    const rowR = Math.round(r + (end[0] - r) * t);
    const rowG = Math.round(g + (end[1] - g) * t);
    const rowB = Math.round(b + (end[2] - b) * t);
    for (let x = 0; x < width; x++) {
      raw[offset++] = rowR;
      raw[offset++] = rowG;
      raw[offset++] = rowB;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Moldura transparente de demonstração, com borda grossa e cantos suaves. */
function buildFramePng(): Buffer {
  const width = 600;
  const height = 800;
  const border = 44;
  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filtro: none
    for (let x = 0; x < width; x++) {
      const edge = x < border || x >= width - border || y < border || y >= height - border;
      const highlight =
        (x > border && x < width - border && y > border && y < border + 10) ||
        (x > border && x < border + 10 && y > border && y < height - border);
      const footer = y >= height - 132 && y < height - 44 && x >= border && x < width - border;

      if (edge) {
        raw[offset++] = 236;
        raw[offset++] = 19;
        raw[offset++] = 128;
        raw[offset++] = 230;
      } else if (highlight) {
        raw[offset++] = 255;
        raw[offset++] = 255;
        raw[offset++] = 255;
        raw[offset++] = 95;
      } else if (footer) {
        raw[offset++] = 142;
        raw[offset++] = 24;
        raw[offset++] = 180;
        raw[offset++] = 150;
      } else {
        raw[offset++] = 0;
        raw[offset++] = 0;
        raw[offset++] = 0;
        raw[offset++] = 0;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolor RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Seed ─────────────────────────────────────────────────────────────

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

async function uploadPng(key: string, png: Buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: png,
      ContentType: "image/png",
    }),
  );
}

function birthDateFromAgeMonths(ageMonths: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - ageMonths);
  date.setDate(Math.max(1, date.getDate() - 7));
  return date;
}

async function cleanup() {
  const user = await db.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { guardianProfile: true },
  });
  if (!user?.guardianProfile) return;

  const participants = await db.participant.findMany({
    where: { guardianId: user.guardianProfile.id },
  });
  for (const participant of participants) {
    await db.registration.deleteMany({ where: { participantId: participant.id } });
  }
  await db.participant.deleteMany({ where: { guardianId: user.guardianProfile.id } });
  await db.guardianProfile.delete({ where: { id: user.guardianProfile.id } });
  await db.user.delete({ where: { id: user.id } });
}

async function main() {
  const contest = await db.contest.findUnique({ where: { year: 2026 } });
  if (!contest) throw new Error("Concurso 2026 não encontrado — rode `npm run db:seed` antes.");

  await cleanup();

  const frameKey = `contests/${contest.year}/frame-demo.png`;
  await uploadPng(frameKey, buildFramePng());
  await db.contest.update({
    where: { id: contest.id },
    data: { frameImageKey: frameKey },
  });

  const user = await db.user.create({
    data: {
      name: "Responsável Demo",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash("demo1234", 10),
      role: "GUARDIAN",
      guardianProfile: { create: { city: "Londrina", state: "PR" } },
    },
    include: { guardianProfile: true },
  });

  let sequence = 900_001;
  for (const kid of KIDS) {
    const birthDate = birthDateFromAgeMonths(kid.ageMonths);
    const category = await db.category.findFirst({
      where: {
        contestId: contest.id,
        minAgeMonths: { lte: kid.ageMonths },
        maxAgeMonths: { gte: kid.ageMonths },
      },
    });
    if (!category) throw new Error(`Sem categoria para ${kid.name} (${kid.ageMonths} meses).`);

    const participant = await db.participant.create({
      data: {
        guardianId: user.guardianProfile!.id,
        name: kid.name,
        slug: slugify(`${kid.name}-demo`),
        birthDate,
        gender: kid.gender,
        city: kid.city,
        state: kid.state,
        imageConsentAt: new Date(),
      },
    });

    const registration = await db.registration.create({
      data: {
        participantId: participant.id,
        contestId: contest.id,
        categoryId: category.id,
        status: kid.status,
        protocol: buildProtocol(contest.year, sequence++),
        likesCount: kid.likes,
        approvedAt: new Date(),
      },
    });

    for (const [index, color] of kid.colors.entries()) {
      const key = `contests/${contest.year}/registrations/${registration.id}/demo-${index}.png`;
      const nextColor = kid.colors[index + 1] ?? kid.colors[0];
      await uploadPng(key, buildPng(color, index === 0 ? nextColor : undefined));
      await db.photo.create({
        data: {
          registrationId: registration.id,
          storageKey: key,
          order: index,
          isCover: index === 0,
          width: 600,
          height: 800,
        },
      });
    }

    console.log(`✔ ${kid.name} (${category.name}, ${kid.status}, ${kid.likes} likes)`);
  }

  console.log("\nDemo pronta: http://localhost:3001/participantes");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
