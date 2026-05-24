-- AlterTable
ALTER TABLE "ProductLead" ADD COLUMN "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "ScoutAutomationConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "autoImportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveHighScoringLeads" BOOLEAN NOT NULL DEFAULT false,
    "autoGenerateContentBundles" BOOLEAN NOT NULL DEFAULT false,
    "highScoreThreshold" INTEGER NOT NULL DEFAULT 85,
    "rssFeeds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "amazonMoversUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "tiktokKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "pinterestKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "productUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutAutomationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductLead_sourceUrl_idx" ON "ProductLead"("sourceUrl");
