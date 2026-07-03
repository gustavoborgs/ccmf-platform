import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const DEFAULT_WHATSAPP_AUTOMATION_CONFIG = {
  trigger: "SCHEDULED" as const,
  funnelStep: "PENDING_PHOTOS" as const,
  delayHours: 1,
  delayAnchor: "ENTITY_CREATED" as const,
  templateId: "532e7a0c-1380-4001-aa2b-94532c2cd750",
  batchLimit: 50,
  templateBindings: [
    { variable: "guardianName" as const, position: 1 },
    { variable: "resumeUrl" as const, position: 2 },
  ],
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Bebê", slug: "bebe", minAgeMonths: 0, maxAgeMonths: 10, order: 1 },
  { name: "Mirim", slug: "mirim", minAgeMonths: 11, maxAgeMonths: 23, order: 2 },
  { name: "Infantil", slug: "infantil", minAgeMonths: 24, maxAgeMonths: 71, order: 3 },
  { name: "Juvenil", slug: "juvenil", minAgeMonths: 72, maxAgeMonths: 119, order: 4 },
  { name: "Teen", slug: "teen", minAgeMonths: 120, maxAgeMonths: 179, order: 5 },
];

async function main() {
  const adminEmail = "admin@ccmf.com.br";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  const contest = await prisma.contest.upsert({
    where: { year: 2026 },
    update: {},
    create: {
      year: 2026,
      name: "Criança Mais Fotogênica do Brasil 2026",
      status: "REGISTRATION_OPEN",
      registrationFeeCents: 5400,
      revealAt: new Date("2026-11-29T15:00:00-03:00"),
    },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { contestId_slug: { contestId: contest.id, slug: category.slug } },
      update: {},
      create: { ...category, contestId: contest.id },
    });
  }

  const partnersCount = await prisma.partner.count();
  if (partnersCount === 0) {
    await prisma.partner.createMany({
      data: [
        { name: "Studio Kids Fotografia", type: "MASTER", order: 1 },
        { name: "Portal Família BR", type: "MEDIA", order: 1 },
        { name: "Rádio Cidade FM", type: "MEDIA", order: 2 },
        { name: "Brinquedos Alegria", type: "SPONSOR", order: 1 },
        { name: "Moda Baby Brasil", type: "SPONSOR", order: 2 },
      ],
    });
  }

  const existingAutomation = await prisma.automation.findFirst({
    where: { name: "Retomada de inscrição via WhatsApp" },
  });

  if (!existingAutomation) {
    await prisma.automation.create({
      data: {
        type: "WHATSAPP",
        name: "Retomada de inscrição via WhatsApp",
        description: "Envia link de retomada 1h após inscrição sem pagamento.",
        channel: "WHATSAPP",
        enabled: true,
        config: DEFAULT_WHATSAPP_AUTOMATION_CONFIG,
      },
    });
  }

  await prisma.referralCampaign.upsert({
    where: { contestId: contest.id },
    update: {},
    create: {
      contestId: contest.id,
      name: "Indique e ganhe curtidas",
      enabled: true,
      rewardLikesCount: 50,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
