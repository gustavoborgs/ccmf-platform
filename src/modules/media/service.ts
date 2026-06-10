import { db } from "@/shared/db";
import { isValidPhotoAspect } from "@/shared/utils";
import {
  buildPhotoKey,
  createPresignedUploadUrl,
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
    include: { contest: true, _count: { select: { photos: true } } },
  });

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

  return { photo, uploadUrl };
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
