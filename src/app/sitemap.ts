import type { MetadataRoute } from "next";
import { absoluteUrl, postUrl } from "@/modules/blog/seo";
import { listPublishedPosts } from "@/modules/blog/service";
import { listPublicSitemapEntries } from "@/modules/participants/service";

/** Postgres não está acessível durante `next build` no Railway — gera em runtime. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, gallery] = await Promise.all([listSitemapPosts(), listSitemapGallery()]);
  const now = new Date();

  return [
    route("/", "weekly", 1),
    route("/o-concurso", "monthly", 0.8),
    route("/curso", "weekly", 0.9),
    route("/carreira-de-modelo-infantil", "weekly", 0.95),
    route("/regulamento", "monthly", 0.7),
    route("/videos", "weekly", 0.7),
    route("/participantes", "weekly", 0.8),
    route("/inscricao", "weekly", 0.9),
    route("/blog", "weekly", 0.9),
    route("/contato", "monthly", 0.5),
    ...gallery.years.map((entry) => ({
      url: absoluteUrl(`/participantes/${entry.year}`),
      lastModified: entry.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...gallery.profiles.map((entry) => ({
      url: absoluteUrl(`/participantes/${entry.year}/${entry.slug}`),
      lastModified: entry.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: postUrl(post.slug),
      lastModified: post.updatedAt ?? post.publishedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}

async function listSitemapPosts(): Promise<Awaited<ReturnType<typeof listPublishedPosts>>> {
  try {
    return await listPublishedPosts();
  } catch (error) {
    console.error("Falha ao carregar posts para o sitemap.", error);
    return [];
  }
}

async function listSitemapGallery(): Promise<Awaited<ReturnType<typeof listPublicSitemapEntries>>> {
  try {
    return await listPublicSitemapEntries();
  } catch (error) {
    console.error("Falha ao carregar galeria para o sitemap.", error);
    return { years: [], profiles: [] };
  }
}

function route(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: new Date(),
    changeFrequency,
    priority,
  };
}
