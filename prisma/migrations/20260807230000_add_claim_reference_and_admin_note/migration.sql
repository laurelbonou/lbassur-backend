-- Référence lisible du sinistre et note du gestionnaire.
--
-- La référence est produite par la base plutôt que par l'application : deux
-- déclarations simultanées obtiendraient sinon le même numéro, et la contrainte
-- d'unicité ferait échouer l'une des deux au visage du client.

CREATE SEQUENCE "claim_reference_seq";

ALTER TABLE "Claim"
ADD COLUMN "reference" TEXT,
ADD COLUMN "adminNote" TEXT;

-- Les sinistres déjà déclarés reçoivent une référence portant leur année de
-- déclaration, dans l'ordre chronologique.
UPDATE "Claim"
SET "reference" = 'SIN-' || to_char("createdAt", 'YYYY') || '-' ||
                  lpad(nextval('claim_reference_seq')::text, 5, '0')
WHERE "reference" IS NULL;

-- L'année vient de la date d'insertion : la numérotation ne repart pas de zéro
-- au 1er janvier, mais le préfixe reste juste et la référence unique.
ALTER TABLE "Claim"
ALTER COLUMN "reference" SET DEFAULT 'SIN-' || to_char(now(), 'YYYY') || '-' ||
                                     lpad(nextval('claim_reference_seq')::text, 5, '0');

ALTER TABLE "Claim" ALTER COLUMN "reference" SET NOT NULL;

CREATE UNIQUE INDEX "Claim_reference_key" ON "Claim"("reference");
