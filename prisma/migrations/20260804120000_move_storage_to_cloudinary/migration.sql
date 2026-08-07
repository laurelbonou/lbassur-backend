-- Bascule du stockage de fichiers vers Cloudinary.
--
-- On ne stocke plus d'URL pour les pièces jointes : les fichiers sont en accès
-- restreint et l'URL de consultation, signée et expirante, est régénérée à
-- chaque lecture depuis le publicId.
--
-- Les colonnes `url` existantes deviennent nullables et sont conservées : elles
-- portent les anciens chemins `/uploads/...` des fichiers téléversés avant la
-- bascule. Aucune reprise de données n'est nécessaire.

ALTER TABLE "ClaimAttachment"
ADD COLUMN "publicId" TEXT,
ADD COLUMN "resourceType" TEXT,
ADD COLUMN "format" TEXT,
ALTER COLUMN "url" DROP NOT NULL;

ALTER TABLE "Document"
ADD COLUMN "publicId" TEXT,
ADD COLUMN "resourceType" TEXT,
ADD COLUMN "format" TEXT,
ALTER COLUMN "url" DROP NOT NULL;

-- Reçus, contrats et signature : le publicId permet de régénérer l'URL ou de
-- supprimer le fichier. receiptUrl et contractUrl restent utilisés — ils portent
-- une URL signée sans expiration, seule forme exploitable dans un email.
ALTER TABLE "QuoteRequest"
ADD COLUMN "receiptPublicId" TEXT,
ADD COLUMN "contractPublicId" TEXT,
ADD COLUMN "signaturePublicId" TEXT;
