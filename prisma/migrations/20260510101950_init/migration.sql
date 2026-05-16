-- CreateTable
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amazonLink" TEXT,
    "affiliateLink" TEXT,
    "price" DOUBLE PRECISION,
    "source" TEXT,
    "viralTrendNotes" TEXT,
    "contentIdea" TEXT,
    "blogPostStatus" TEXT NOT NULL DEFAULT 'Needs Content',
    "pinStatus" TEXT NOT NULL DEFAULT 'Pending',
    "tiktokStatus" TEXT NOT NULL DEFAULT 'Pending',
    "commissionPotential" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "featuredImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentBundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "blogPostTitle" TEXT,
    "blogPostOutline" TEXT,
    "shortDescription" TEXT,
    "pinTitle" TEXT,
    "pinDescription" TEXT,
    "tiktokHook" TEXT,
    "tiktokScript" TEXT,
    "facebookCaption" TEXT,
    "emailBlurb" TEXT,
    "suggestedHashtags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentBundle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_ProductBlogPosts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProductBlogPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProductBlogPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ContentBundle_productId_key" ON "ContentBundle"("productId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_ProductBlogPosts_AB_unique" ON "_ProductBlogPosts"("A", "B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_ProductBlogPosts_B_index" ON "_ProductBlogPosts"("B");
