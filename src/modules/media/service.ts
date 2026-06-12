import { db } from "@/shared/db";
import { isValidBlogCoverAspect, isValidPartnerLogoDimensions, isValidPhotoAspect } from "@/shared/utils";
import {
  buildBlogCoverKey,
  buildContestFrameKey,
  buildPartnerLogoKey,
  buildPhotoKey,
  createPresignedUploadUrl,
  deleteObject,
  getPublicUrl,
} from "@/shared/integrations/s3/storage";

/**
 * Módulo Media: upload de fotos (presigned URL) e moldura.
 * Spec: docs/modules/media.md
 *
 * Padrão de imagem: retrato 3:4 (PHOTO_ASPECT). O crop é feito no frontend
 * e as dimensões finais são validadas aqui antes do presign.
 */

const MAX_PHOTOS_PER_REGISTRATION = 2;
const MIN_FRAME_WIDTH = 600;
const BLOG_COVER_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MIN_BLOG_COVER_WIDTH = 900;
const MIN_BLOG_COVER_HEIGHT = 500;
const PARTNER_LOGO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const PUBLIC_REGISTRATION_STATUSES: readonly string[] = ["APPROVED", "SEMIFINALIST", "WINNER"];

export type MediaCachePolicy = "public-photo" | "public-asset" | "private";

/** Gera URL de upload direto para o S3 e registra a foto na inscrição. */
export async function requestPhotoUpload(params: {
  registrationId: string;
  fileName: string;
  contentType: string;
  /** dimensões do arquivo já cropado (3:4) */
  width: number;
  height: number;
}) {
  if (!isValidPhotoAspect(params.width, params.height)) {
    throw new Error("A foto deve estar no formato retrato 3:4 (use o recorte).");
  }

  const registration = await db.registration.findUniqueOrThrow({
    where: { id: params.registrationId },
    include: {
      contest: true,
      participant: { select: { slug: true } },
      _count: { select: { photos: true } },
    },
  });

  if (registration.deletedAt) {
    throw new Error("Esta inscrição foi cancelada.");
  }
  if (registration._count.photos >= MAX_PHOTOS_PER_REGISTRATION) {
    throw new Error(`Limite de ${MAX_PHOTOS_PER_REGISTRATION} fotos por inscrição.`);
  }

  const key = buildPhotoKey({
    contestYear: registration.contest.year,
    registrationId: registration.id,
    fileName: params.fileName,
  });

  const { uploadUrl } = await createPresignedUploadUrl(key, params.contentType);

  const photo = await db.photo.create({
    data: {
      registrationId: registration.id,
      storageKey: key,
      order: registration._count.photos,
      isCover: registration._count.photos === 0,
      width: params.width,
      height: params.height,
    },
  });

  return { photo, uploadUrl, registration };
}

const GUARDIAN_PHOTO_EDIT_STATUSES: readonly string[] = ["DRAFT", "PENDING_PAYMENT"];

/** Nova foto pelo responsável (`/conta`) — antes da confirmação do pagamento. */
export async function requestPhotoUploadForGuardian(params: {
  guardianId: string;
  registrationId: string;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
}) {
  const registration = await db.registration.findUnique({
    where: { id: params.registrationId },
    select: {
      id: true,
      status: true,
      deletedAt: true,
      participant: { select: { guardianId: true } },
    },
  });
  if (!registration || registration.participant.guardianId !== params.guardianId) {
    throw new Error("Inscrição não encontrada.");
  }
  if (registration.deletedAt) {
    throw new Error("Esta inscrição foi cancelada.");
  }
  if (!GUARDIAN_PHOTO_EDIT_STATUSES.includes(registration.status)) {
    throw new Error("As fotos não podem ser alteradas após a confirmação do pagamento.");
  }

  return requestPhotoUpload(params);
}

/**
 * Substituição de foto pelo responsável (`/conta`) — permitida apenas antes da
 * confirmação do pagamento. Remove a foto antiga (banco + S3) preservando
 * ordem/capa e emite presigned URL para o novo arquivo.
 */
export async function replaceRegistrationPhotoForGuardian(params: {
  guardianId: string;
  photoId: string;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
}) {
  if (!isValidPhotoAspect(params.width, params.height)) {
    throw new Error("A foto deve estar no formato retrato 3:4 (use o recorte).");
  }

  const photo = await db.photo.findUnique({
    where: { id: params.photoId },
    include: {
      registration: {
        select: {
          id: true,
          status: true,
          deletedAt: true,
          contest: { select: { year: true } },
          participant: { select: { guardianId: true } },
        },
      },
    },
  });
  if (!photo || photo.registration.participant.guardianId !== params.guardianId) {
    throw new Error("Foto não encontrada.");
  }
  if (photo.registration.deletedAt) {
    throw new Error("Esta inscrição foi cancelada.");
  }
  if (!GUARDIAN_PHOTO_EDIT_STATUSES.includes(photo.registration.status)) {
    throw new Error("As fotos não podem ser alteradas após a confirmação do pagamento.");
  }

  const key = buildPhotoKey({
    contestYear: photo.registration.contest.year,
    registrationId: photo.registration.id,
    fileName: params.fileName,
  });

  const { uploadUrl } = await createPresignedUploadUrl(key, params.contentType);

  const newPhoto = await db.$transaction(async (tx) => {
    await tx.photo.delete({ where: { id: photo.id } });
    return tx.photo.create({
      data: {
        registrationId: photo.registrationId,
        storageKey: key,
        order: photo.order,
        isCover: photo.isCover,
        width: params.width,
        height: params.height,
      },
    });
  });

  await deleteObject(photo.storageKey).catch(() => {
    // objeto antigo órfão no S3 não compromete o fluxo
  });

  return { photo: newPhoto, uploadUrl };
}

/** Remove uma foto da inscrição e promove a próxima foto disponível para capa. */
export async function removeRegistrationPhoto(photoId: string) {
  const photo = await db.photo.findUnique({
    where: { id: photoId },
    include: {
      registration: {
        include: {
          contest: { select: { year: true } },
          participant: { select: { slug: true } },
          photos: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!photo) throw new Error("Foto não encontrada.");

  const remainingPhotos = photo.registration.photos.filter((item) => item.id !== photo.id);

  const [, ...updates] = await db.$transaction([
    db.photo.delete({ where: { id: photo.id } }),
    ...remainingPhotos.map((item, index) =>
      db.photo.update({
        where: { id: item.id },
        data: { order: index, isCover: index === 0 },
      }),
    ),
  ]);

  await deleteObject(photo.storageKey);

  return {
    registrationId: photo.registrationId,
    storageKey: photo.storageKey,
    contestYear: photo.registration.contest.year,
    participantSlug: photo.registration.participant.slug,
    updatedPhotos: updates,
  };
}

/** Gera URL de upload direto para a moldura PNG transparente da edição. */
export async function requestContestFrameUpload(params: {
  contestYear: number;
  contentType: string;
  width: number;
  height: number;
}) {
  if (params.contentType !== "image/png") {
    throw new Error("A moldura deve ser um PNG transparente.");
  }
  if (params.width < MIN_FRAME_WIDTH) {
    throw new Error(`A moldura deve ter pelo menos ${MIN_FRAME_WIDTH}px de largura.`);
  }
  if (!isValidPhotoAspect(params.width, params.height)) {
    throw new Error("A moldura deve estar no formato retrato 3:4.");
  }

  const key = buildContestFrameKey(params.contestYear);
  const { uploadUrl } = await createPresignedUploadUrl(key, params.contentType);

  return { key, uploadUrl };
}

/** Gera URL de upload direto para a capa de um post do blog. */
export async function requestBlogCoverUpload(params: {
  postId: string;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
}) {
  const post = await db.blogPost.findUnique({
    where: { id: params.postId },
    select: { id: true },
  });
  if (!post) throw new Error("Post não encontrado.");

  if (!BLOG_COVER_CONTENT_TYPES.includes(params.contentType as (typeof BLOG_COVER_CONTENT_TYPES)[number])) {
    throw new Error("A capa deve ser JPG, PNG ou WebP.");
  }
  if (params.width < MIN_BLOG_COVER_WIDTH || params.height < MIN_BLOG_COVER_HEIGHT) {
    throw new Error(
      `A capa deve ter pelo menos ${MIN_BLOG_COVER_WIDTH}x${MIN_BLOG_COVER_HEIGHT}px.`,
    );
  }
  if (!isValidBlogCoverAspect(params.width, params.height)) {
    throw new Error("A capa deve estar no formato paisagem 16:10.");
  }

  const key = buildBlogCoverKey(params.postId, params.fileName);
  const { uploadUrl } = await createPresignedUploadUrl(key, params.contentType);

  return { key, uploadUrl };
}

/** Gera URL de upload direto para o logo padronizado de parceiro (800x400). */
export async function requestPartnerLogoUpload(params: {
  partnerId: string;
  fileName: string;
  contentType: string;
  width: number;
  height: number;
}) {
  const partner = await db.partner.findUnique({
    where: { id: params.partnerId },
    select: { id: true },
  });
  if (!partner) throw new Error("Parceiro não encontrado.");

  if (!PARTNER_LOGO_CONTENT_TYPES.includes(params.contentType as (typeof PARTNER_LOGO_CONTENT_TYPES)[number])) {
    throw new Error("O logo deve ser JPG, PNG ou WebP.");
  }
  if (!isValidPartnerLogoDimensions(params.width, params.height)) {
    throw new Error("O logo deve estar no padrão 800x400px.");
  }

  const key = buildPartnerLogoKey(params.partnerId, params.fileName);
  const { uploadUrl } = await createPresignedUploadUrl(key, params.contentType);

  return { key, uploadUrl };
}

/**
 * Dados para o download da "foto com moldura" do participante aprovado.
 * A composição (foto + moldura do concurso) é feita no client via canvas.
 * Evolução futura (server-side com sharp): ver docs/modules/media.md.
 */
export async function getFramedPhotoData(registrationId: string) {
  const registration = await db.registration.findUniqueOrThrow({
    where: { id: registrationId },
    include: { contest: true, photos: { where: { isCover: true }, take: 1 } },
  });

  const cover = registration.photos[0];
  if (!cover || !registration.contest.frameImageKey) return null;

  return {
    photoUrl: getPublicUrl(cover.storageKey),
    frameUrl: getPublicUrl(registration.contest.frameImageKey),
  };
}

/**
 * Decide se a rota /api/media pode usar cache compartilhado.
 * Fotos de inscrição só recebem cache público após aprovação/publicação.
 */
export async function getMediaCachePolicy(storageKey: string): Promise<MediaCachePolicy> {
  if (storageKey.startsWith("blog/") || storageKey.startsWith("partners/") || isContestFrameKey(storageKey)) {
    return "public-asset";
  }

  if (!isRegistrationPhotoKey(storageKey)) return "private";

  const photo = await db.photo.findFirst({
    where: { storageKey },
    select: { registration: { select: { status: true } } },
  });

  return photo && PUBLIC_REGISTRATION_STATUSES.includes(photo.registration.status)
    ? "public-photo"
    : "private";
}

function isContestFrameKey(storageKey: string): boolean {
  return /^contests\/\d{4}\/frame(?:-[a-z0-9-]+)?\.[a-z0-9]+$/i.test(storageKey);
}

function isRegistrationPhotoKey(storageKey: string): boolean {
  return /^contests\/\d{4}\/registrations\/[^/]+\/[^/]+$/i.test(storageKey);
}
