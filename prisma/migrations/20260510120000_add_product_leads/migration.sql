-- CreateEnum
CREATE TYPE "ProductLeadStatus" AS ENUM ('New', 'Approved', 'Rejected');

-- CreateTable
CREATE TABLE "ProductLead" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "trendKeyword" TEXT,
    "suggestedCategory" TEXT,
    "estimatedPrice" DOUBLE PRECISION,
    "reasonItMightSell" TEXT NOT NULL,
    "viralityScore" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductLeadStatus" NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductLead_status_createdAt_idx" ON "ProductLead"("status", "createdAt");
