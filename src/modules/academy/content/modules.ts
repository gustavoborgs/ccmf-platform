import type { AcademyModule } from "../types";
import { getModuleCoverPath } from "../visual-assets";

/** Definição dos módulos do treinamento. */
export const modules: AcademyModule[] = [
  {
    slug: "welcome",
    order: 0,
    title: "Boas-vindas",
    description: "Carta da Claudia, método de estudo e tudo o que você vai dominar ao final da formação.",
    cover: getModuleCoverPath("welcome"),
  },
  {
    slug: "mindset",
    order: 1,
    title: "A mentalidade do pai-gestor",
    description: "Framework POFIA, sinais da criança, autoestima e o mapa mental do pai-gestor.",
    cover: getModuleCoverPath("mindset"),
  },
  {
    slug: "market",
    order: 2,
    title: "Conhecendo o jogo",
    description: "Mercado, portas de entrada, concurso x agência x book, golpes e por dentro de um job real.",
    cover: getModuleCoverPath("market"),
  },
  {
    slug: "assets",
    order: 3,
    title: "Os ativos do talento",
    description: "Imagem, marca digital, repertório por idade, rede de apoio e dossiê oficial do talento.",
    cover: getModuleCoverPath("assets"),
  },
  {
    slug: "management",
    order: 4,
    title: "Gestão na prática",
    description: "Plano por fases, orçamento, contratos, negociação, equilíbrio familiar e quando parar.",
    cover: getModuleCoverPath("management"),
  },
  {
    slug: "action",
    order: 5,
    title: "O primeiro passo agora",
    description: "Primeiro passo com concurso sério, plano semana a semana e kit completo de ferramentas.",
    cover: getModuleCoverPath("action"),
  },
];
