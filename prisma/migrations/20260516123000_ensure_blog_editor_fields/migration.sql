-- Deployment safety net for environments where editor columns were added manually
-- or an earlier deploy partially provisioned the schema. This preserves all rows.
ALTER TABLE "BlogPost"
  ADD COLUMN IF NOT EXISTS "subtitle" TEXT,
  ADD COLUMN IF NOT EXISTS "authorName" TEXT DEFAULT 'Jessica',
  ADD COLUMN IF NOT EXISTS "affiliateDisclosure" TEXT DEFAULT 'This post may contain affiliate links. As an Amazon Associate, I earn from qualifying purchases at no extra cost to you.',
  ADD COLUMN IF NOT EXISTS "ctaText" TEXT DEFAULT 'Shop the Find',
  ADD COLUMN IF NOT EXISTS "labelFavoritePick" TEXT DEFAULT 'Favorite Pick',
  ADD COLUMN IF NOT EXISTS "labelVanityTray" TEXT DEFAULT 'The Vanity Tray',
  ADD COLUMN IF NOT EXISTS "labelWorthIt" TEXT DEFAULT 'Worth It?',
  ADD COLUMN IF NOT EXISTS "editorSections" JSONB,
  ADD COLUMN IF NOT EXISTS "imageLibrary" JSONB,
  ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
