-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductLeadStatus') THEN
    CREATE TYPE "ProductLeadStatus" AS ENUM ('New', 'Approved', 'Rejected');
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductLead" (
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
CREATE INDEX IF NOT EXISTS "ProductLead_status_createdAt_idx" ON "ProductLead"("status", "createdAt");
