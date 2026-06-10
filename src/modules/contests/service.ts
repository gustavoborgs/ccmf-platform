import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/shared/db";
import { resolvePagination } from "@/shared/list-params";
import { ageInMonths, slugify } from "@/shared/utils";
import type { AdminContestFilters, CategoryFormInput, ContestFormInput, ContestStatusValue } from "./validators";

/**
 * Módulo Contests: concurso ativo, categorias e regras de elegibilidade.
 * Spec: docs/modules/contests.md
 */

/** Concurso com inscrições abertas (no máximo um por vez). */
export function getActiveContest() {
  return db.contest.findFirst({
    where: { status: "REGISTRATION_OPEN" },
    include: { categories: { orderBy: { order: "asc" } } },
  });
}

/** Opções de filtro por edição/categoria para as listagens administrativas. */
export function listContestFilterOptions() {
  return db.contest.findMany({
    select: {
      id: true,
      year: true,
      name: true,
      categories: {
        select: { id: true, name: true, order: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { year: "desc" },
  });
}

export function getContestByYear(year: number) {
  return db.contest.findUnique({
    where: { year },
    include: { categories: { orderBy: { order: "asc" } } },
  });
}

/**
 * Resolve a categoria pela idade atual da criança (regra do regulamento:
 * vale a idade na data da inscrição).
 */
export async function findCategoryForBirthDate(contestId: string, birthDate: Date) {
  const months = ageInMonths(birthDate);
  return db.category.findFirst({
    where: {
      contestId,
      minAgeMonths: { lte: months },
      maxAgeMonths: { gte: months },
    },
  });
}

// ── Gestão administrativa de edições ─────────────────────────────────

/** Listagem administrativa paginada (par do kit DataTable). */
export async function listAdminContests(filters: AdminContestFilters) {
  const where: Prisma.ContestWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.q) {
    const yearQuery = Number.parseInt(filters.q, 10);
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      ...(Number.isInteger(yearQuery) ? [{ year: yearQuery }] : []),
    ];
  }

  const total = await db.contest.count({ where });
  const { skip, ...pagination } = resolvePagination(total, filters.page, filters.pageSize);

  const items = await db.contest.findMany({
    where,
    include: { _count: { select: { categories: true, registrations: true } } },
    orderBy: { year: "desc" },
    skip,
    take: pagination.pageSize,
  });

  return { items, pagination };
}

/** Edição completa para a tela de gestão: categorias ordenadas + contagens. */
export function getAdminContestById(contestId: string) {
  return db.contest.findUnique({
    where: { id: contestId },
    include: {
      categories: {
        include: { _count: { select: { registrations: true } } },
        orderBy: { order: "asc" },
      },
      _count: { select: { registrations: true } },
    },
  });
}

export async function createContest(input: ContestFormInput) {
  const existing = await db.contest.findUnique({ where: { year: input.year } });
  if (existing) {
    throw new Error(`Já existe uma edição para o ano ${input.year} (${existing.name}).`);
  }

  return db.contest.create({ data: input });
}

export async function updateContest(contestId: string, input: ContestFormInput) {
  const conflict = await db.contest.findUnique({ where: { year: input.year } });
  if (conflict && conflict.id !== contestId) {
    throw new Error(`Já existe uma edição para o ano ${input.year} (${conflict.name}).`);
  }

  return db.contest.update({ where: { id: contestId }, data: input });
}

/**
 * Muda o status da edição. Regra de negócio: no máximo **uma** edição
 * pode estar com inscrições abertas ao mesmo tempo.
 */
export async function updateContestStatus(contestId: string, status: ContestStatusValue) {
  if (status === "REGISTRATION_OPEN") {
    const open = await db.contest.findFirst({
      where: { status: "REGISTRATION_OPEN", id: { not: contestId } },
    });
    if (open) {
      throw new Error(
        `A edição ${open.year} (${open.name}) já está com inscrições abertas. Encerre-a antes de abrir outra.`,
      );
    }
  }

  return db.contest.update({ where: { id: contestId }, data: { status } });
}

// ── Gestão de categorias (faixas etárias em meses) ───────────────────

/** Garante que a faixa não sobrepõe outra categoria da mesma edição. */
async function assertNoAgeOverlap(
  contestId: string,
  range: { minAgeMonths: number; maxAgeMonths: number },
  excludeCategoryId?: string,
) {
  const overlapping = await db.category.findFirst({
    where: {
      contestId,
      ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {}),
      minAgeMonths: { lte: range.maxAgeMonths },
      maxAgeMonths: { gte: range.minAgeMonths },
    },
  });
  if (overlapping) {
    throw new Error(
      `A faixa informada sobrepõe a categoria "${overlapping.name}" ` +
        `(${overlapping.minAgeMonths} a ${overlapping.maxAgeMonths} meses).`,
    );
  }
}

async function assertUniqueSlug(contestId: string, slug: string, excludeCategoryId?: string) {
  const existing = await db.category.findUnique({
    where: { contestId_slug: { contestId, slug } },
  });
  if (existing && existing.id !== excludeCategoryId) {
    throw new Error(`Já existe uma categoria com o nome "${existing.name}" nesta edição.`);
  }
}

export async function createCategory(contestId: string, input: CategoryFormInput) {
  const contest = await db.contest.findUnique({ where: { id: contestId } });
  if (!contest) throw new Error("Edição não encontrada.");

  const slug = slugify(input.name);
  await assertUniqueSlug(contestId, slug);
  await assertNoAgeOverlap(contestId, input);

  const last = await db.category.findFirst({
    where: { contestId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return db.category.create({
    data: { ...input, contestId, slug, order: (last?.order ?? -1) + 1 },
  });
}

export async function updateCategory(categoryId: string, input: CategoryFormInput) {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Categoria não encontrada.");

  const slug = slugify(input.name);
  await assertUniqueSlug(category.contestId, slug, categoryId);
  await assertNoAgeOverlap(category.contestId, input, categoryId);

  return db.category.update({ where: { id: categoryId }, data: { ...input, slug } });
}

export async function deleteCategory(categoryId: string) {
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!category) throw new Error("Categoria não encontrada.");
  if (category._count.registrations > 0) {
    throw new Error(
      `A categoria "${category.name}" tem ${category._count.registrations} inscrição(ões) e não pode ser excluída.`,
    );
  }

  return db.category.delete({ where: { id: categoryId } });
}

/** Troca a posição da categoria com a vizinha (reordenação na tabela). */
export async function moveCategory(categoryId: string, direction: "up" | "down") {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Categoria não encontrada.");

  const neighbor = await db.category.findFirst({
    where: {
      contestId: category.contestId,
      order: direction === "up" ? { lt: category.order } : { gt: category.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return category;

  const [updated] = await db.$transaction([
    db.category.update({ where: { id: category.id }, data: { order: neighbor.order } }),
    db.category.update({ where: { id: neighbor.id }, data: { order: category.order } }),
  ]);
  return updated;
}
