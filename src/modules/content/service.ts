import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { extractYoutubeVideoId } from "./youtube";
import type { AdminPartnerFilters, AdminVideoFilters, PartnerFormInput, VideoFormInput } from "./validators";

/**
 * Módulo Content: vídeos, parceiros/patrocinadores e contato.
 * Spec: docs/modules/content.md
 */

const videoSelect = {
  id: true,
  title: true,
  youtubeUrl: true,
  order: true,
  published: true,
} satisfies Prisma.VideoSelect;

const partnerSelect = {
  id: true,
  name: true,
  type: true,
  logoKey: true,
  url: true,
  order: true,
  active: true,
} satisfies Prisma.PartnerSelect;

export function listVideos() {
  return db.video.findMany({
    where: { published: true },
    select: videoSelect,
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });
}

export async function listAdminVideos(filters: AdminVideoFilters) {
  const where: Prisma.VideoWhereInput = {};

  if (filters.visibility === "published") where.published = true;
  if (filters.visibility === "draft") where.published = false;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { youtubeUrl: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const total = await db.video.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.video.findMany({
    where,
    select: videoSelect,
    orderBy: [{ order: "asc" }, { title: "asc" }],
    skip,
    take: pagination.pageSize,
  });

  return { items, pagination };
}

export function getAdminVideoById(videoId: string) {
  return db.video.findUnique({ where: { id: videoId }, select: videoSelect });
}

export function createVideo(input: VideoFormInput) {
  assertYoutubeUrl(input.youtubeUrl);
  return db.video.create({ data: normalizeVideoInput(input), select: videoSelect });
}

export async function updateVideo(videoId: string, input: VideoFormInput) {
  assertYoutubeUrl(input.youtubeUrl);
  await assertVideoExists(videoId);
  return db.video.update({
    where: { id: videoId },
    data: normalizeVideoInput(input),
    select: videoSelect,
  });
}

export async function deleteVideo(videoId: string) {
  await assertVideoExists(videoId);
  return db.video.delete({ where: { id: videoId }, select: videoSelect });
}

export function listPartnersByType() {
  return db.partner.findMany({
    where: { active: true },
    select: partnerSelect,
    orderBy: [{ type: "asc" }, { order: "asc" }],
  });
}

export async function listAdminPartners(filters: AdminPartnerFilters) {
  const where: Prisma.PartnerWhereInput = {};

  if (filters.type) where.type = filters.type;
  if (filters.visibility === "active") where.active = true;
  if (filters.visibility === "inactive") where.active = false;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { url: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const total = await db.partner.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.partner.findMany({
    where,
    select: partnerSelect,
    orderBy: [{ type: "asc" }, { order: "asc" }, { name: "asc" }],
    skip,
    take: pagination.pageSize,
  });

  return { items, pagination };
}

export function getAdminPartnerById(partnerId: string) {
  return db.partner.findUnique({ where: { id: partnerId }, select: partnerSelect });
}

export function createPartner(input: PartnerFormInput) {
  return db.partner.create({ data: normalizePartnerInput(input), select: partnerSelect });
}

export async function updatePartner(partnerId: string, input: PartnerFormInput) {
  await assertPartnerExists(partnerId);
  return db.partner.update({
    where: { id: partnerId },
    data: normalizePartnerInput(input),
    select: partnerSelect,
  });
}

export async function updatePartnerLogo(partnerId: string, logoKey: string | null) {
  await assertPartnerExists(partnerId);
  return db.partner.update({
    where: { id: partnerId },
    data: { logoKey },
    select: partnerSelect,
  });
}

export async function deletePartner(partnerId: string) {
  await assertPartnerExists(partnerId);
  return db.partner.delete({ where: { id: partnerId }, select: partnerSelect });
}

export function createContactMessage(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  return db.contactMessage.create({ data });
}

function normalizeVideoInput(input: VideoFormInput): VideoFormInput {
  return {
    ...input,
    title: input.title.trim(),
    youtubeUrl: input.youtubeUrl.trim(),
  };
}

function normalizePartnerInput(input: PartnerFormInput): PartnerFormInput {
  return {
    ...input,
    name: input.name.trim(),
    url: input.url?.trim() || null,
    logoKey: input.logoKey?.trim() || null,
  };
}

function assertYoutubeUrl(youtubeUrl: string) {
  if (!extractYoutubeVideoId(youtubeUrl)) {
    throw new Error("Informe uma URL válida do YouTube.");
  }
}

async function assertVideoExists(videoId: string) {
  const video = await db.video.findUnique({ where: { id: videoId }, select: { id: true } });
  if (!video) throw new Error("Vídeo não encontrado.");
}

async function assertPartnerExists(partnerId: string) {
  const partner = await db.partner.findUnique({ where: { id: partnerId }, select: { id: true } });
  if (!partner) throw new Error("Parceiro não encontrado.");
}
