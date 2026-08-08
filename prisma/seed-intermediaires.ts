/**
 * Seed des intermédiaires d'assurance (courtiers + agents généraux).
 *
 * SOURCES
 *  - Courtiers      : "LISTE ET CODES COURTIERS.pdf" — liste officielle du Ministère
 *                     de l'Économie et des Finances du Bénin, exercice 2026,
 *                     signée le 24 juin 2026 (N° 010/MEF-MFF/DC/SGM/DGSF/DA/SIFR).
 *                     Les codes sont les annotations manuscrites = codes L'AFRICAINE.
 *  - Agents généraux: "code agents generaux.xlsx" — codes internes L'AFRICAINE.
 *
 * ATTENTION : les codes ci-dessous sont ceux de L'AFRICAINE DES ASSURANCES uniquement.
 * Le même courtier porte un code différent chez NSIA, SUNU, SanlamAllianz, etc.
 * D'où la table BrokerInsurerCode : un intermédiaire, N codes (un par compagnie).
 *
 * Lancement :  npx tsx prisma/seed-intermediaires.ts
 */
import { PrismaClient, IntermediaryType } from "@prisma/client";
import { slugify } from "../src/common/slugify";

const prisma = new PrismaClient();

/** Slug de la compagnie à laquelle se rattachent les codes de ce fichier. */
const INSURER_SLUG = "africaine-assurances";

/** Exercice de la liste ministérielle utilisée. */
const APPROVAL_YEAR = 2026;

// ─────────────────────────────────────────────────────────────────────────────
// COURTIERS — liste ministérielle 2026 (54 sociétés agréées)
// `code` = code L'Africaine. `null` signifie « code non connu de nous » (noté
// "???" sur le document source), pas « ce courtier n'a pas de code » : il en a
// probablement un, à récupérer auprès de la compagnie.
// ─────────────────────────────────────────────────────────────────────────────
const COURTIERS: { rank: number; name: string; code: string | null }[] = [
  { rank: 1,  name: "ADONAÏ NISSI Assurances",                                     code: "3640" },
  { rank: 2,  name: "AD GLOBAL INSURANCE",                                         code: "3810" },
  { rank: 3,  name: "Africa Brokers' Cie",                                         code: "3250" },
  { rank: 4,  name: "Africa BSI",                                                  code: "3630" },
  { rank: 5,  name: "Afrique Courtage",                                            code: "3321" },
  { rank: 6,  name: "ANEK SARL",                                                   code: "3780" },
  { rank: 7,  name: "ASK GRAS SAVOYE",                                             code: "3001" },
  { rank: 8,  name: "AQUILA Courtage",                                             code: "3710" },
  { rank: 9,  name: "ARECA Assurance",                                             code: "3220" },
  { rank: 10, name: "ARIA Bénin",                                                  code: "3301" },
  { rank: 11, name: "ASCOMA Bénin",                                                code: "3100" },
  { rank: 12, name: "Assur-Invest SARL",                                           code: "3451" },
  { rank: 13, name: "AZUR Courtage",                                               code: "3111" },
  { rank: 14, name: "BAOBA Courtage",                                              code: "3760" },
  { rank: 15, name: "BECOTRAC",                                                    code: "3650" },
  { rank: 16, name: "BENIN Challenge",                                             code: "3351" },
  { rank: 17, name: "BENINVEST Assurances",                                        code: "3270" },
  { rank: 18, name: "BILEKANLE Prestations",                                       code: "3750" },
  { rank: 19, name: "BLOOM Insurance",                                             code: "3730" },
  { rank: 20, name: "CAURIASS Courtage",                                           code: "3471" },
  { rank: 21, name: "CICA MSF",                                                    code: "3740" },
  { rank: 22, name: "Courtage-Actuariat-Ingénierie des Risques (CAIR Afrique)",    code: "3560" },
  { rank: 23, name: "Courtage et Assistance en Assurance (CAA)",                   code: "3481" },
  { rank: 24, name: "Courtage de DJID'S",                                          code: "3720" },
  { rank: 25, name: "CECA SARL",                                                   code: "3071" },
  { rank: 26, name: "Comptoir de Gestion en Assurance (CGA)",                      code: "3551" },
  { rank: 27, name: "2CA",                                                         code: "3051" },
  { rank: 28, name: "DAYO BENIN",                                                  code: "3660" },
  { rank: 29, name: "EASY INSURANCE SOLUTIONS",                                    code: "3521" },
  { rank: 30, name: "EPMB FREEMAN Assurance",                                      code: "3590" },
  { rank: 31, name: "Étoile Prestige Courtage",                                    code: "3620" },
  { rank: 32, name: "Excel Conseil Assur",                                         code: "3690" },
  { rank: 33, name: "FARIZ Assurances",                                            code: "3491" },
  { rank: 34, name: "FIRHAM Assureur Conseil",                                     code: "3571" },
  { rank: 35, name: "GB Courtage",                                                 code: "3680" },
  { rank: 36, name: "GENESIS CAPITAL",                                             code: null   }, // code Africaine inconnu à ce jour
  { rank: 37, name: "GESCAR Assurances",                                           code: "3391" },
  { rank: 38, name: "JOHNSON Insurance",                                           code: "3330" },
  { rank: 39, name: "KAMERS SARL",                                                 code: "3531" },
  { rank: 40, name: "KIETUD",                                                      code: "3790" },
  { rank: 41, name: "KOINONIA BROKER",                                             code: "3800" },
  { rank: 42, name: "LBASSUR",                                                     code: "3610" }, // nous
  { rank: 43, name: "La Protectrice",                                              code: "3411" },
  { rank: 44, name: "NAP'S",                                                       code: "3541" },
  { rank: 45, name: "OKASSUR",                                                     code: "3511" },
  { rank: 46, name: "OLEA Bénin",                                                  code: "3361" },
  { rank: 47, name: "PREVALYA Bénin",                                              code: "3770" },
  { rank: 48, name: "REIMOKO ASSIR",                                               code: "3670" },
  { rank: 49, name: "RISKRE AFRICA GROUP",                                         code: null   }, // code Africaine inconnu à ce jour
  { rank: 50, name: "SAECO Assurances",                                            code: "3073" },
  { rank: 51, name: "SEPEC Assurances",                                            code: "3381" },
  { rank: 52, name: "SERENA Courtage Assurance",                                   code: "3401" },
  { rank: 53, name: "TABITHA Assurances",                                          code: "3371" },
  { rank: 54, name: "TIWANI Capital",                                              code: "3700" },
];

// ─────────────────────────────────────────────────────────────────────────────
// AGENTS GÉNÉRAUX L'AFRICAINE (36) — rattachés exclusivement à cette compagnie.
// `city` est déduite du nom de l'agence quand la localité y figure explicitement ;
// null sinon (à compléter par l'administrateur).
// ─────────────────────────────────────────────────────────────────────────────
const AGENTS_GENERAUX: { code: string; name: string; city: string | null }[] = [
  { code: "2021", name: "PRÉVOYANCE KANDI",                 city: "Kandi" },
  { code: "2031", name: "TRIANGLE CALAVI",                  city: "Abomey-Calavi" },
  { code: "2041", name: "ASSURANCES DES COLLINES DASSA",    city: "Dassa-Zoumè" },
  { code: "2051", name: "ASSURANCES DU MONO LOKOSSA",       city: "Lokossa" },
  { code: "2052", name: "ASSURANCES DU MONO AZOVE",         city: "Azovè" },
  { code: "2061", name: "ASSURANCES DU PLATEAU POBE",       city: "Pobè" },
  { code: "2071", name: "AGENCE GÉNÉRALE VEDOKO",           city: "Cotonou" },
  { code: "2081", name: "VICTORIA ASSURANCES COT. FIFAD",   city: "Cotonou" },
  { code: "2161", name: "AGENCE SAINT MICHEL",              city: null },
  { code: "2171", name: "AGENCE DE L'AMITIÉ",               city: null },
  { code: "2191", name: "AGENCE DE GODOMEY",                city: "Godomey" },
  { code: "2211", name: "AGENCE MARC ASSUR",                city: null },
  { code: "2221", name: "ANGELA ASSUR",                     city: null },
  { code: "2261", name: "AGENCE LA MANNE",                  city: null },
  { code: "2281", name: "AGENCE BENEDICTUS",                city: null },
  { code: "2291", name: "AGENCE BAYOL",                     city: "Cotonou" },
  { code: "2301", name: "AGENCE OLAITAN",                   city: null },
  { code: "2341", name: "AGENCE GLORIA",                    city: null },
  { code: "2361", name: "AGENCE HILACONDJI",                city: "Hillacondji" },
  { code: "2411", name: "AGENCE SABBAT",                    city: null },
  { code: "2421", name: "AGENCE OKPE OLUWA",                city: null },
  { code: "2471", name: "AGENCE SIKECODJI",                 city: "Cotonou" },
  { code: "2491", name: "AGENCE SICA-ASSUR",                city: null },
  { code: "2501", name: "AGENCE MARCASSUR KRAKE",           city: "Kraké" },
  { code: "2511", name: "AGENCE COCOTOMEY",                 city: "Cocotomey" },
  { code: "2531", name: "EL SHADDAI",                       city: null },
  { code: "2591", name: "AGENCE ÉTOILE BARAKA",             city: null },
  { code: "2621", name: "AGENCE SENAMI CORPORATE",          city: null },
  { code: "2631", name: "AGENCE LES BÉATITUDES",            city: null },
  { code: "2641", name: "B & DKC BOHICON",                  city: "Bohicon" },
  { code: "2651", name: "AGENCE B & DKC NATITINGOU",        city: "Natitingou" },
  { code: "2661", name: "AGENCE B & DKC DJOUGOU",           city: "Djougou" },
  { code: "2691", name: "AGENCE EDMAG CONSEILS",            city: null },
  { code: "2701", name: "AGENCE ZOROBABEL",                 city: null },
  { code: "2731", name: "AGENCE EDMAG ADJAGBO",             city: "Adjagbo" },
  { code: "2750", name: "B&DKC PARAKOU",                    city: "Parakou" },
];

/** Génère un slug unique en suffixant si nécessaire. */
function uniqueSlug(base: string, taken: Set<string>) {
  let slug = slugify(base);
  let n = 2;
  while (taken.has(slug)) slug = `${slugify(base)}-${n++}`;
  taken.add(slug);
  return slug;
}

async function main() {
  const insurer = await prisma.insurer.findUnique({ where: { slug: INSURER_SLUG } });
  if (!insurer) {
    throw new Error(
      `Compagnie "${INSURER_SLUG}" introuvable. Lancez d'abord "yarn db:seed".`,
    );
  }

  const taken = new Set((await prisma.broker.findMany({ select: { slug: true } })).map((b) => b.slug));
  let createdCourtiers = 0;
  let createdAgents = 0;
  let codesLinked = 0;

  // ── Courtiers ──
  for (const c of COURTIERS) {
    const existing = await prisma.broker.findFirst({
      where: { name: c.name, type: IntermediaryType.COURTIER },
    });

    const broker =
      existing ??
      (await prisma.broker.create({
        data: {
          name: c.name,
          slug: uniqueSlug(c.name, taken),
          type: IntermediaryType.COURTIER,
          approvalRank: c.rank,
          approvalYear: APPROVAL_YEAR,
          insurerId: null, // un courtier n'est lié à aucune compagnie
        },
      }));
    if (!existing) createdCourtiers++;

    if (c.code) {
      await prisma.brokerInsurerCode.upsert({
        where: { brokerId_insurerId: { brokerId: broker.id, insurerId: insurer.id } },
        update: { code: c.code },
        create: { brokerId: broker.id, insurerId: insurer.id, code: c.code },
      });
      codesLinked++;
    }
  }

  // ── Agents généraux ──
  for (const a of AGENTS_GENERAUX) {
    const existing = await prisma.broker.findFirst({
      where: { name: a.name, type: IntermediaryType.AGENT_GENERAL, insurerId: insurer.id },
    });

    const broker =
      existing ??
      (await prisma.broker.create({
        data: {
          name: a.name,
          slug: uniqueSlug(a.name, taken),
          type: IntermediaryType.AGENT_GENERAL,
          insurerId: insurer.id, // mandaté exclusivement par L'Africaine
          city: a.city,
        },
      }));
    if (!existing) createdAgents++;

    await prisma.brokerInsurerCode.upsert({
      where: { brokerId_insurerId: { brokerId: broker.id, insurerId: insurer.id } },
      update: { code: a.code },
      create: { brokerId: broker.id, insurerId: insurer.id, code: a.code },
    });
    codesLinked++;
  }

  console.log(`✓ Courtiers créés          : ${createdCourtiers} / ${COURTIERS.length}`);
  console.log(`✓ Agents généraux créés    : ${createdAgents} / ${AGENTS_GENERAUX.length}`);
  console.log(`✓ Codes Africaine rattachés: ${codesLinked}`);
  console.log(
    `  (code Africaine à récupérer : ${COURTIERS.filter((c) => !c.code).map((c) => c.name).join(", ")})`,
  );
  console.log(
    "  Aucun taux de reversement n'est posé : ils restent NULL jusqu'à négociation.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
