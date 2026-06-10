export type CropArea = { x: number; y: number; width: number; height: number };

type CropOptions = {
  maxWidth?: number;
  maxHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
  mimeType?: string;
  quality?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function cropImageToBlob(
  imageSrc: string,
  area: CropArea,
  options: CropOptions = {},
): Promise<{ blob: Blob; width: number; height: number }> {
  const image = await loadImage(imageSrc);
  const hasTargetSize = Boolean(options.targetWidth && options.targetHeight);
  const scale = hasTargetSize
    ? 1
    : Math.min(
        1,
        options.maxWidth ? options.maxWidth / area.width : 1,
        options.maxHeight ? options.maxHeight / area.height : 1,
      );
  const width = options.targetWidth ?? Math.round(area.width * scale);
  const height = options.targetHeight ?? Math.round(area.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);

  const sourceX = Math.max(0, area.x);
  const sourceY = Math.max(0, area.y);
  const sourceRight = Math.min(image.naturalWidth, area.x + area.width);
  const sourceBottom = Math.min(image.naturalHeight, area.y + area.height);
  const sourceWidth = sourceRight - sourceX;
  const sourceHeight = sourceBottom - sourceY;

  if (sourceWidth > 0 && sourceHeight > 0) {
    const destinationX = ((sourceX - area.x) / area.width) * width;
    const destinationY = ((sourceY - area.y) / area.height) * height;
    const destinationWidth = (sourceWidth / area.width) * width;
    const destinationHeight = (sourceHeight / area.height) * height;

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight,
    );
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Falha ao recortar a imagem."))),
      options.mimeType ?? "image/jpeg",
      options.quality ?? 0.9,
    );
  });

  return { blob, width, height };
}
