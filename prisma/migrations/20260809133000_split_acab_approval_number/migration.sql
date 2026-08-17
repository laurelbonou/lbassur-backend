-- Correction de la migration precedente : « approvalRank » n'a pas le meme sens
-- des deux cotes. Chez nous c'est le RANG dans la liste du Ministere (1, 2, 3…),
-- utile pour restituer la liste dans l'ordre — donc un entier. L'ACAB renvoie
-- de son cote un NUMERO D'AGREMENT (« 3358 », « 1530 MEF/DC/SGM/DGAE/DA »),
-- qui est une autre donnee. Les fusionner aurait ecrase le rang.
--
-- Le retour a INTEGER est sans risque : les valeurs presentes sont les rangs
-- convertis a l'aller (« 1 » … « 54 »), tous numeriques.
ALTER TABLE "Broker"
  ALTER COLUMN "approvalRank" TYPE INTEGER USING "approvalRank"::INTEGER;

-- Le numero d'agrement transmis par l'ACAB, dans sa propre colonne.
ALTER TABLE "Broker"
  ADD COLUMN "acabApprovalNumber" TEXT;
