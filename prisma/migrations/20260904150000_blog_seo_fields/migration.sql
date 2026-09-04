-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN "metaDescription" TEXT;
ALTER TABLE "blog_posts" ADD COLUMN "category" TEXT;

-- CreateIndex
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");
