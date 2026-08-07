CREATE TYPE "ClaimAttachmentKind" AS ENUM ('PHOTO', 'AUDIO', 'DOCUMENT');

CREATE TABLE "ClaimAttachment" (
  "id" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "kind" "ClaimAttachmentKind" NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClaimAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClaimAttachment_claimId_idx" ON "ClaimAttachment"("claimId");

ALTER TABLE "ClaimAttachment"
ADD CONSTRAINT "ClaimAttachment_claimId_fkey"
FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
