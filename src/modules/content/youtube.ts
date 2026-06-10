const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extrai o ID canônico de URLs comuns do YouTube.
 * Aceita watch, youtu.be, embed, shorts e live.
 */
export function extractYoutubeVideoId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    candidate =
      url.searchParams.get("v") ??
      readPathId(url.pathname, "embed") ??
      readPathId(url.pathname, "shorts") ??
      readPathId(url.pathname, "live");
  }

  if (!candidate) return null;
  const id = candidate.split(/[?&]/)[0];
  return YOUTUBE_ID_PATTERN.test(id) ? id : null;
}

export function getYoutubeThumbnailUrl(youtubeUrl: string): string | null {
  const id = extractYoutubeVideoId(youtubeUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function getYoutubeEmbedUrl(youtubeUrl: string): string | null {
  const id = extractYoutubeVideoId(youtubeUrl);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

function readPathId(pathname: string, segment: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf(segment);
  return index >= 0 ? (parts[index + 1] ?? null) : null;
}
