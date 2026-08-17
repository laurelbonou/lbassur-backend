-- L'ACAB a retire « approvalRank » de la reponse de /oauth/token : le champ
-- decrivait un numero d'agrement ministeriel qui n'en etait pas un, et le
-- numero d'adherent (DDDDDD-ACAB-DDDDDD) suffit a identifier le cabinet.
--
-- La colonne ne recevra donc plus jamais de valeur. On la retire plutot que
-- de laisser une colonne morte qu'un lecteur futur croirait alimentee.
-- Aucune donnee n'est perdue : elle n'a jamais ete ecrite en production.
ALTER TABLE "Broker" DROP COLUMN IF EXISTS "acabApprovalNumber";
