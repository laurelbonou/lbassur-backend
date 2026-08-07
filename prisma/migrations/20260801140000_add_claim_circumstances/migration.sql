CREATE TYPE "ClaimType" AS ENUM (
  'COLLISION',
  'VOL',
  'INCENDIE',
  'BRIS_DE_GLACE',
  'DEGAT_DES_EAUX',
  'CATASTROPHE_NATURELLE',
  'AUTRE'
);

-- Toutes les colonnes sont nullables ou pourvues d'un défaut : les sinistres
-- déjà déclarés restent valides sans reprise de données.
ALTER TABLE "Claim"
ADD COLUMN "claimType" "ClaimType",
ADD COLUMN "incidentTime" TEXT,
ADD COLUMN "locationCity" TEXT,
ADD COLUMN "locationDetails" TEXT,
ADD COLUMN "hasInjuries" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasAmicableReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasPoliceReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "policeReportRef" TEXT,
ADD COLUMN "thirdPartyName" TEXT,
ADD COLUMN "thirdPartyPlate" TEXT,
ADD COLUMN "thirdPartyInsurer" TEXT,
ADD COLUMN "thirdPartyPolicy" TEXT;
