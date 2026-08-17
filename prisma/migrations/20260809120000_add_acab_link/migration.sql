-- L'ACAB renvoie l'agrement ministeriel sous forme de chaine : il porte
-- parfois la mention de l'autorite qui l'a delivre (« 1530 MEF/DC/SGM/DGAE/DA »),
-- qu'une colonne entiere ne peut pas stocker. La conversion est sans perte :
-- les valeurs deja presentes sont des entiers, qui restent lisibles en texte.
ALTER TABLE "Broker"
  ALTER COLUMN "approvalRank" TYPE TEXT USING "approvalRank"::TEXT;

-- Rattachement a l'annuaire ACAB, renseigne au premier « Se connecter avec ACAB ».
ALTER TABLE "Broker"
  ADD COLUMN "acabNumber"   TEXT,
  ADD COLUMN "acabStatus"   TEXT,
  ADD COLUMN "acabSyncedAt" TIMESTAMP(3);

-- Un numero d'adherent ne peut designer qu'un seul intermediaire chez nous :
-- c'est cet index qui empeche deux comptes courtiers de partager une identite.
CREATE UNIQUE INDEX "Broker_acabNumber_key" ON "Broker"("acabNumber");
