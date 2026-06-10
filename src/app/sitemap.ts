import type { MetadataRoute } from "next";
import { absoluteUrl, postUrl } from "@/modules/blog/seo";
import { listPublishedPosts } from "@/modules/blog/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPublishedPosts();
  const now = new Date();

  return [
    route("/", "weekly", 1),
    route("/o-concurso", "monthly", 0.8),
    route("/regulamento", "monthly", 0.7),
    route("/videos", "weekly", 0.7),
    route("/participantes", "weekly", 0.8),
    route("/blog", "weekly", 0.9),
    route("/contato", "monthly", 0.5),
    ...posts.map((post) => ({
      url: postUrl(post.slug),
      lastModified: post.updatedAt ?? post.publishedAt ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
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
