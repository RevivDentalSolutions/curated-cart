ALTER TABLE "BlogPost"
  ADD COLUMN "subtitle" TEXT,
  ADD COLUMN "authorName" TEXT DEFAULT 'Jessica',
  ADD COLUMN "affiliateDisclosure" TEXT DEFAULT 'This post may contain affiliate links. As an Amazon Associate, I earn from qualifying purchases at no extra cost to you.',
  ADD COLUMN "ctaText" TEXT DEFAULT 'Shop the Find',
  ADD COLUMN "labelFavoritePick" TEXT DEFAULT 'Favorite Pick',
  ADD COLUMN "labelVanityTray" TEXT DEFAULT 'The Vanity Tray',
  ADD COLUMN "labelWorthIt" TEXT DEFAULT 'Worth It?',
  ADD COLUMN "editorSections" JSONB,
  ADD COLUMN "imageLibrary" JSONB,
  ADD COLUMN "scheduledAt" TIMESTAMP(3);
