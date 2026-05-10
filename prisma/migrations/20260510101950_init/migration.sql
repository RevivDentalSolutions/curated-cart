-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amazonLink" TEXT,
    "affiliateLink" TEXT,
    "price" REAL,
    "source" TEXT,
    "viralTrendNotes" TEXT,
    "contentIdea" TEXT,
    "blogPostStatus" TEXT NOT NULL DEFAULT 'Needs Content',
    "pinStatus" TEXT NOT NULL DEFAULT 'Pending',
    "tiktokStatus" TEXT NOT NULL DEFAULT 'Pending',
    "commissionPotential" TEXT,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "featuredImage" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentBundle" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentBundle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProductBlogPosts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProductBlogPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProductBlogPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBundle_productId_key" ON "ContentBundle"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductBlogPosts_AB_unique" ON "_ProductBlogPosts"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductBlogPosts_B_index" ON "_ProductBlogPosts"("B");
