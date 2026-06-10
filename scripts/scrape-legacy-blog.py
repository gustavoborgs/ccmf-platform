#!/usr/bin/env python3
"""Scrape legacy CCMF blog posts into reviewable Markdown drafts.

This script intentionally writes to docs/blog-import instead of touching the
database or S3. The generated files keep source URLs and original image URLs so
the editorial/import step can validate content before publishing.
"""

from __future__ import annotations

import json
import re
import textwrap
from dataclasses import dataclass, asdict
from datetime import datetime
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup


ROOT_URL = "https://criancamaisfotogenica.com.br/"
BLOG_URL = "https://criancamaisfotogenica.com.br/blog"
OUTPUT_DIR = Path("docs/blog-import")


@dataclass
class BlogPost:
    title: str
    slug: str
    sourceUrl: str
    publishedAt: str | None
    excerpt: str
    originalImageUrl: str | None
    thumbnailUrl: str | None
    content: str


def fetch_soup(url: str) -> BeautifulSoup:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", "replace")
    return BeautifulSoup(html, "html.parser")


def clean_text(value: str | None) -> str:
    text = unescape(value or "").replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"\.{2,}", ".", text)
    text = text.replace(" ,", ",").strip()
    return apply_common_corrections(text)


def apply_common_corrections(text: str) -> str:
    replacements = {
        "Crianca Mais Fotogenica": "Criança Mais Fotogênica",
        "Crianca mais Fotogenica": "Criança Mais Fotogênica",
        "Criança mais Fotogênica": "Criança Mais Fotogênica",
        "Criança Mais Fotogenica": "Criança Mais Fotogênica",
        "Concuro": "Concurso",
        "seu filho ou filha": "seu filho ou sua filha",
        "por que escrever sua criança": "por que inscrever sua criança",
        "Por que escrever sua criança": "Por que inscrever sua criança",
        "com o Concurso Crianca Mais Fotogenica do Brasil": "com o Concurso Criança Mais Fotogênica do Brasil",
        "Concurso “A Criança Mais Fotogênica 2024": "Concurso A Criança Mais Fotogênica 2024",
        "Concurso “A Criança Mais Fotogênica": "Concurso A Criança Mais Fotogênica",
        "Concurso ‘A Criança Mais Fotogênica do Brasil": "Concurso A Criança Mais Fotogênica do Brasil",
        "carreira de de sua criança": "carreira de sua criança",
        "forma física.No geral": "forma física. No geral",
    }
    for before, after in replacements.items():
        text = text.replace(before, after)
    return text


def iso_date(value: str | None) -> str | None:
    if not value:
        return None
    return datetime.strptime(value, "%d/%m/%Y").date().isoformat()


def yaml_string(value: str | None) -> str:
    if value is None:
        return "null"
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def discover_posts() -> list[dict[str, str | None]]:
    posts_by_url: dict[str, dict[str, str | None]] = {}

    for page in range(1, 6):
        url = BLOG_URL if page == 1 else f"{BLOG_URL}/pagina/{page}"
        soup = fetch_soup(url)

        for card in soup.select("li.blog-item.card"):
            link = card.find("a", href=True)
            if not link:
                continue

            source_url = urljoin(ROOT_URL, link["href"])
            path = urlparse(source_url).path.strip("/")
            if path == "blog" or not path.startswith("blog/") or path.startswith("blog/pagina"):
                continue

            title_node = card.find(["h3", "h2"])
            image_node = card.find("img")
            title = clean_text(title_node.get_text(" ", strip=True) if title_node else "")
            texts = [clean_text(item) for item in card.stripped_strings]
            date = next((item for item in texts if re.fullmatch(r"\d{2}/\d{2}/\d{4}", item)), None)
            card_text = clean_text(card.get_text(" ", strip=True))
            excerpt = card_text
            if title:
                excerpt = excerpt.replace(title, "", 1).strip()
            if date:
                excerpt = excerpt.replace(date, "").strip()
            excerpt = excerpt.removesuffix("...").strip()

            posts_by_url[source_url] = {
                "title": title,
                "slug": path.split("/", 1)[1],
                "sourceUrl": source_url,
                "publishedAt": iso_date(date),
                "excerpt": excerpt,
                "thumbnailUrl": urljoin(ROOT_URL, image_node["src"]) if image_node and image_node.get("src") else None,
            }

    return list(posts_by_url.values())


def extract_main_image(soup: BeautifulSoup) -> str | None:
    og_image = soup.find("meta", attrs={"property": "og:image"})
    if og_image and og_image.get("content"):
        return urljoin(ROOT_URL, og_image["content"])

    for image in soup.find_all("img"):
        src = image.get("src")
        if src and "_data/blog/" in src and "-thumb-" not in src:
            return urljoin(ROOT_URL, src)

    return None


def extract_article_markdown(soup: BeautifulSoup, title: str) -> str:
    article = soup.find("article")
    if not article:
        return ""

    paragraphs: list[str] = []
    skip_next_caption = False
    for node in article.find_all(["p", "h1", "h2", "h3", "li"], recursive=True):
        if node.find_parent("figure"):
            continue
        text = clean_text(node.get_text(" ", strip=True))
        if not text or text == title:
            continue
        if skip_next_caption:
            skip_next_caption = False
            continue
        if should_skip_paragraph(text):
            if text.lower().startswith("legenda da imagem"):
                skip_next_caption = True
            continue
        paragraphs.append(text)

    return paragraphs_to_markdown(paragraphs)


def should_skip_paragraph(text: str) -> bool:
    lowered = text.lower().strip()
    if re.fullmatch(r"[.\s]+", text):
        return True
    if text.startswith("#") and not text.startswith("# "):
        return True
    return lowered in {
        "texto do post:",
        "legenda da imagem interna:",
        "legenda da imagem:",
    }


def paragraphs_to_markdown(paragraphs: list[str]) -> str:
    lines: list[str] = []

    for index, paragraph in enumerate(paragraphs):
        next_paragraph = paragraphs[index + 1] if index + 1 < len(paragraphs) else ""
        previous_line = lines[-1] if lines else ""

        if is_heading_like(paragraph, next_paragraph, previous_line):
            lines.append(f"## {sentence_case_heading(paragraph)}")
        else:
            lines.append(paragraph)

    return "\n\n".join(lines).strip()


def is_heading_like(text: str, next_text: str, previous_line: str) -> bool:
    if not next_text or previous_line.startswith("## "):
        return False
    if len(text) > 95 or len(next_text) < 80:
        return False
    if text.count(".") > 1:
        return False
    return not text.endswith(("?", "!"))


def sentence_case_heading(text: str) -> str:
    if not text:
        return text
    return text[0].upper() + text[1:]


def build_posts() -> list[BlogPost]:
    posts: list[BlogPost] = []

    for metadata in discover_posts():
        soup = fetch_soup(metadata["sourceUrl"] or "")
        title = clean_text(metadata["title"])
        content = extract_article_markdown(soup, title)
        original_image_url = extract_main_image(soup)
        excerpt = build_excerpt(clean_text(metadata["excerpt"]), content)

        posts.append(
            BlogPost(
                title=title,
                slug=metadata["slug"] or "",
                sourceUrl=metadata["sourceUrl"] or "",
                publishedAt=metadata["publishedAt"],
                excerpt=excerpt,
                originalImageUrl=original_image_url,
                thumbnailUrl=metadata["thumbnailUrl"],
                content=content,
            )
        )

    return posts


def build_excerpt(listing_excerpt: str, content: str) -> str:
    if listing_excerpt and len(listing_excerpt) >= 90 and not listing_excerpt.endswith((",", " e", " que")):
        return listing_excerpt[:260].strip()

    plain = re.sub(r"^#{1,3}\s+", "", content, flags=re.MULTILINE)
    plain = clean_text(plain)
    if len(plain) <= 260:
        return plain

    excerpt = plain[:260].rsplit(" ", 1)[0].strip()
    return excerpt.rstrip(",.;:")


def write_markdown(post: BlogPost) -> None:
    path = OUTPUT_DIR / "posts" / f"{post.slug}.md"
    frontmatter = [
        "---",
        f"title: {yaml_string(post.title)}",
        f"slug: {yaml_string(post.slug)}",
        f"publishedAt: {yaml_string(post.publishedAt)}",
        f"excerpt: {yaml_string(post.excerpt)}",
        f"sourceUrl: {yaml_string(post.sourceUrl)}",
        f"originalImageUrl: {yaml_string(post.originalImageUrl)}",
        f"thumbnailUrl: {yaml_string(post.thumbnailUrl)}",
        "---",
        "",
    ]
    path.write_text("\n".join(frontmatter) + post.content + "\n", encoding="utf-8")


def write_readme(posts: Iterable[BlogPost]) -> None:
    post_list = list(posts)
    lines = [
        "# Importação do blog legado",
        "",
        "Conteúdo extraído de https://criancamaisfotogenica.com.br/blog para revisão editorial antes da publicação no novo módulo de blog.",
        "",
        "## O que foi gerado",
        "",
        "- `posts/*.md`: um arquivo por post, com frontmatter e conteúdo em Markdown.",
        "- `posts.json`: os mesmos dados em formato estruturado para um importador futuro.",
        "",
        "## Observações",
        "",
        "- As imagens foram preservadas como URLs originais (`originalImageUrl` e `thumbnailUrl`). Para publicar no app, baixe/suba essas imagens para o S3 e grave apenas a `coverKey` no banco.",
        "- A limpeza editorial foi conservadora: normaliza espaços, corrige acentos/termos óbvios e transforma subtítulos curtos em `##`.",
        "- Recomenda-se revisar duplicidades entre posts com temas muito próximos antes da publicação final.",
        "",
        f"Total de posts extraídos: {len(post_list)}.",
        "",
        "## Posts",
        "",
    ]

    for post in post_list:
        lines.append(f"- {post.publishedAt or 'sem data'} · `{post.slug}` · {post.title}")

    (OUTPUT_DIR / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    posts = build_posts()
    (OUTPUT_DIR / "posts").mkdir(parents=True, exist_ok=True)

    for post in posts:
        write_markdown(post)

    (OUTPUT_DIR / "posts.json").write_text(
        json.dumps([asdict(post) for post in posts], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_readme(posts)

    print(f"Generated {len(posts)} posts in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
