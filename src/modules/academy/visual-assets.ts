/**
 * Manifesto de assets visuais do treinamento Academy.
 * Fonte única de paths — trocar placeholder → final aqui quando as imagens estiverem prontas.
 * Brief de produção: docs/academy-visual-production.md
 */

export type ImageAssetStatus = "placeholder" | "ready";

export type ImageAssetSpec = {
  id: string;
  path: string;
  /** Path do placeholder atual (SVG) enquanto o final não existe */
  placeholderPath: string;
  status: ImageAssetStatus;
  width: number;
  height: number;
  aspectRatio: string;
  format: "webp" | "png" | "svg";
  priority: "P0" | "P1" | "P2";
  usage: string[];
};

const PLACEHOLDER = "/academy/module-placeholder.svg";
const COVER_PLACEHOLDER = "/academy/cover-training.svg";
const TIMELINE_PLACEHOLDER = "/academy/diagram-timeline.svg";
const FUNNEL_PLACEHOLDER = "/academy/diagram-funnel.svg";
const COMPARISON_PLACEHOLDER = "/academy/diagram-comparison.svg";

/** Retorna o path ativo (final se ready, senão placeholder). */
export function resolveAsset(asset: ImageAssetSpec): string {
  return asset.status === "ready" ? asset.path : asset.placeholderPath;
}

export const ACADEMY_COVER: ImageAssetSpec = {
  id: "cover-training",
  path: "/academy/cover-training.png",
  placeholderPath: COVER_PLACEHOLDER,
  status: "ready",
  width: 768,
  height: 1024,
  aspectRatio: "3:4",
  format: "png",
  priority: "P0",
  usage: ["/conta/formacao — TrainingHero"],
};

export const MODULE_COVERS: Record<string, ImageAssetSpec> = {
  welcome: {
    id: "module-welcome",
    path: "/academy/module-welcome.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1024,
    height: 768,
    aspectRatio: "4:3",
    format: "png",
    priority: "P0",
    usage: ["Módulo 0 — Boas-vindas", "ChapterHero caps 1–3"],
  },
  mindset: {
    id: "module-mindset",
    path: "/academy/module-mindset.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1024,
    height: 768,
    aspectRatio: "4:3",
    format: "png",
    priority: "P0",
    usage: ["Módulo 1 — Mentalidade", "ChapterHero caps 4–7"],
  },
  market: {
    id: "module-market",
    path: "/academy/module-market.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1024,
    height: 768,
    aspectRatio: "4:3",
    format: "png",
    priority: "P0",
    usage: ["Módulo 2 — Mercado", "ChapterHero caps 8–11"],
  },
  assets: {
    id: "module-assets",
    path: "/academy/module-assets.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1024,
    height: 768,
    aspectRatio: "4:3",
    format: "png",
    priority: "P0",
    usage: ["Módulo 3 — Ativos", "ChapterHero caps 12–15"],
  },
  management: {
    id: "module-management",
    path: "/academy/module-management.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1024,
    height: 768,
    aspectRatio: "4:3",
    format: "png",
    priority: "P0",
    usage: ["Módulo 4 — Gestão", "ChapterHero caps 16–20"],
  },
  action: {
    id: "module-action",
    path: "/academy/module-action.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1024,
    height: 768,
    aspectRatio: "4:3",
    format: "png",
    priority: "P0",
    usage: ["Módulo 5 — Ação", "ChapterHero caps 21–23"],
  },
};

export const DIAGRAM_ASSETS: Record<string, ImageAssetSpec> = {
  timeline: {
    id: "diagram-timeline",
    path: "/academy/diagram-timeline.png",
    placeholderPath: TIMELINE_PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 960,
    aspectRatio: "16:10",
    format: "png",
    priority: "P1",
    usage: ["Capítulo plano-por-fases"],
  },
  funnel: {
    id: "diagram-funnel",
    path: "/academy/diagram-funnel.png",
    placeholderPath: FUNNEL_PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 960,
    aspectRatio: "16:10",
    format: "png",
    priority: "P1",
    usage: ["Capítulo fotogenia-primeiro-passo"],
  },
  comparison: {
    id: "diagram-comparison",
    path: "/academy/diagram-comparison.png",
    placeholderPath: COMPARISON_PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 960,
    aspectRatio: "16:10",
    format: "png",
    priority: "P1",
    usage: ["Capítulo concurso-agencia-book"],
  },
};

export const CASE_ASSETS: Record<string, ImageAssetSpec> = {
  backstage: {
    id: "case-backstage",
    path: "/academy/cases/case-backstage.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    format: "png",
    priority: "P2",
    usage: ["Blocos Caso Real — bastidor de foto"],
  },
  tvSet: {
    id: "case-tv-set",
    path: "/academy/cases/case-tv-set.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    format: "png",
    priority: "P2",
    usage: ["Blocos Caso Real — set de TV"],
  },
  training: {
    id: "case-training",
    path: "/academy/cases/case-training.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    format: "png",
    priority: "P2",
    usage: ["Blocos Caso Real — teatro/dança"],
  },
  familyPlan: {
    id: "case-family-plan",
    path: "/academy/cases/case-family-plan.png",
    placeholderPath: PLACEHOLDER,
    status: "ready",
    width: 1536,
    height: 1024,
    aspectRatio: "3:2",
    format: "png",
    priority: "P2",
    usage: ["Blocos Caso Real — planejamento familiar"],
  },
};

/** Selos editoriais SVG (P3). */
export const BADGE_ASSETS = {
  caseStudy: "/academy/badges/badge-case-study.svg",
  alert: "/academy/badges/badge-alert.svg",
  exercise: "/academy/badges/badge-exercise.svg",
  takeaways: "/academy/badges/badge-takeaways.svg",
} as const;

/** Capa de um módulo para ChapterHero e ModuleIndex. */
export function getModuleCoverPath(moduleSlug: string): string {
  const asset = MODULE_COVERS[moduleSlug];
  return asset ? resolveAsset(asset) : PLACEHOLDER;
}

/** Capa principal do treinamento. */
export function getTrainingCoverPath(): string {
  return resolveAsset(ACADEMY_COVER);
}

/** Diagrama por chave. */
export function getDiagramPath(key: keyof typeof DIAGRAM_ASSETS): string {
  return resolveAsset(DIAGRAM_ASSETS[key]);
}

/** Cena de caso real por chave. */
export function getCasePath(key: keyof typeof CASE_ASSETS): string {
  return resolveAsset(CASE_ASSETS[key]);
}

/** Lista completa para checklist de produção. */
export function listAllImageAssets(): ImageAssetSpec[] {
  return [
    ACADEMY_COVER,
    ...Object.values(MODULE_COVERS),
    ...Object.values(DIAGRAM_ASSETS),
    ...Object.values(CASE_ASSETS),
  ];
}

/** Quantos assets ainda estão em placeholder. */
export function countPendingAssets(): number {
  return listAllImageAssets().filter((a) => a.status === "placeholder").length;
}
