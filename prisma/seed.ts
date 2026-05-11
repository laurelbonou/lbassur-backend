import "dotenv/config";
import { BillingPeriod, InsuranceCategory, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const insurers = [
  {
    name: "L'Africaine des Assurances",
    slug: "africaine-assurances",
    logoUrl: "/images/partners/africaine-assurance.png",
    description: "Leader historique en IARD au Benin.",
    website: "https://www.africaine-assur.com/",
    categories: [InsuranceCategory.IARDT, InsuranceCategory.VIE],
  },
  {
    name: "NOBILA Assurances",
    slug: "nobila-assurances",
    logoUrl: "/images/partners/nobila-assurance.png",
    description: "Acteur dynamique du marche.",
    website: "https://nobilaassurances.com/",
    categories: [InsuranceCategory.IARDT],
  },
  {
    name: "SanlamAllianz",
    slug: "sanlam-allianz",
    logoUrl: "/images/partners/sanlam-allianz.png",
    description: "Leader panafricain en assurances.",
    website: "https://bj.sanlamallianz.com/",
    categories: [InsuranceCategory.IARDT, InsuranceCategory.VIE],
  },
  {
    name: "SUNU Assurances",
    slug: "sunu-assurances",
    logoUrl: "/images/partners/sunu_assurance.png",
    description: "Expertise regionale reconnue.",
    website: "https://sunuassurances.com/ci/",
    categories: [InsuranceCategory.IARDT, InsuranceCategory.VIE],
  },
  {
    name: "NSIA Assurances",
    slug: "nsia-assurances",
    logoUrl: "/images/partners/nsia-assurance.png",
    description: "Vrai visage de l'assurance.",
    website: "https://groupensia.com",
    categories: [InsuranceCategory.IARDT, InsuranceCategory.VIE],
  },
  {
    name: "Reference CIMA",
    slug: "cima",
    logoUrl: null,
    description: "Tarif plancher legal (CIMA).",
    website: null,
    categories: [InsuranceCategory.IARDT],
  },
];

const insuranceTypes = [
  { label: "Assurance Automobile", category: InsuranceCategory.IARDT, subType: "Vehicules et Mobilite" },
  { label: "Assurance Moto", category: InsuranceCategory.IARDT, subType: "Vehicules et Mobilite" },
  { label: "Multirisque Habitation", category: InsuranceCategory.IARDT, subType: "Biens et Activite" },
  { label: "Multirisque Professionnelle", category: InsuranceCategory.IARDT, subType: "Biens et Activite" },
  { label: "Assurance Sante", category: InsuranceCategory.PERSONNES },
  { label: "Assurance Voyage", category: InsuranceCategory.PERSONNES },
  { label: "Epargne & Retraite", category: InsuranceCategory.VIE },
];

async function main() {
  const insurerBySlug = new Map<string, { id: string }>();
  const typeBySlug = new Map<string, { id: string; label: string; category: InsuranceCategory; subType: string | null }>();

  for (const insurer of insurers) {
    const created = await prisma.insurer.upsert({
      where: { slug: insurer.slug },
      update: insurer,
      create: insurer,
      select: { id: true, slug: true },
    });
    insurerBySlug.set(created.slug, created);
  }

  for (const type of insuranceTypes) {
    const slug = slugify(type.label);
    const created = await prisma.insuranceType.upsert({
      where: { slug },
      update: { ...type, slug },
      create: { ...type, slug },
      select: { id: true, slug: true, label: true, category: true, subType: true },
    });
    typeBySlug.set(created.slug, created);
  }

  const autoType = typeBySlug.get("assurance-automobile");
  const motoType = typeBySlug.get("assurance-moto");

  if (!autoType || !motoType) {
    throw new Error("Required insurance types were not seeded.");
  }

  const offers = [
    {
      id: "auto-africaine",
      insurerSlug: "africaine-assurances",
      type: autoType,
      premium: 54632,
      coverageAmount: 10000000,
      franchise: 0,
      guarantees: ["Responsabilite Civile", "Defense et Recours", "Individuelle Accident"],
      optionalGuarantees: ["Vol", "Incendie", "Bris de Glace", "Tous Risques"],
      exclusions: ["Conduite en etat d'ivresse", "Absence de permis"],
      duration: "1 a 12 mois",
      waitingPeriod: "Immediat",
      terms: "Tarif officiel Zone Rouge, 7-10CV, usage Promenade & Affaires.",
      rating: 4.0,
      isMandatory: true,
      tag: "Meilleur Prix",
    },
    {
      id: "auto-nobila",
      insurerSlug: "nobila-assurances",
      type: autoType,
      premium: 64609,
      coverageAmount: 10000000,
      franchise: 0,
      guarantees: ["Responsabilite Civile", "Defense et Recours", "Individuelle Accident", "Couverture CEDEAO"],
      optionalGuarantees: ["Vol", "Incendie", "Bris de Glace", "Tous Risques"],
      exclusions: ["Conduite sans permis", "Usage non conforme"],
      duration: "1 a 12 mois",
      waitingPeriod: "Immediat",
      terms: "TALD 2025, Zone Rouge, 7-10CV, S1/C1.",
      rating: 3.8,
      isMandatory: true,
      tag: "CEDEAO Incluse",
    },
    {
      id: "moto-africaine",
      insurerSlug: "africaine-assurances",
      type: motoType,
      premium: 14772,
      coverageAmount: 5000000,
      franchise: 0,
      guarantees: ["Responsabilite Civile", "Accident Corporel Conducteur"],
      optionalGuarantees: ["Vol", "Incendie"],
      exclusions: ["Conduite sans casque", "Absence de permis A"],
      duration: "12 mois",
      waitingPeriod: "Immediat",
      terms: "Tarif Zone Rouge pour moto particuliers et utilitaires.",
      rating: 4.0,
      isMandatory: true,
      tag: "Meilleur Prix",
    },
    {
      id: "auto-cima",
      insurerSlug: "cima",
      type: autoType,
      premium: 54633,
      coverageAmount: 10000000,
      franchise: 0,
      guarantees: ["Responsabilite Civile", "Defense et Recours", "Individuelle Accident"],
      optionalGuarantees: [],
      exclusions: [],
      duration: "12 mois",
      waitingPeriod: "Immediat",
      terms: "Tarif plancher legal CIMA.",
      rating: 3.0,
      isMandatory: true,
      tag: "Minimum Legal",
    },
    {
      id: "moto-nobila",
      insurerSlug: "nobila-assurances",
      type: motoType,
      premium: 17303,
      coverageAmount: 3000000,
      franchise: 0,
      guarantees: ["Responsabilite Civile"],
      optionalGuarantees: ["Accident Corporel Conducteur", "Vol"],
      exclusions: ["Usage commercial non declare"],
      duration: "12 mois",
      waitingPeriod: "Immediat",
      terms: "Tarif standard CIMA 2 roues.",
      rating: 3.8,
      isMandatory: true,
    },
    {
      id: "moto-sanlam",
      insurerSlug: "sanlam-allianz",
      type: motoType,
      premium: 17303,
      coverageAmount: 4000000,
      franchise: 0,
      guarantees: ["Responsabilite Civile", "Defense et Recours"],
      optionalGuarantees: ["Accident Corporel Conducteur", "Vol", "Incendie"],
      exclusions: ["Conduite sans casque", "Absence de permis"],
      duration: "12 mois",
      waitingPeriod: "Immediat",
      terms: "Formule complete deux roues.",
      rating: 4.3,
      isMandatory: true,
      tag: "Populaire",
    },
    {
      id: "voyage-afg-schengen",
      insurerSlug: "afg-assurances",
      type: typeBySlug.get("assurance-voyage")!,
      premium: 17153,
      coverageAmount: 8000000,
      franchise: 0,
      guarantees: ["Frais Medicaux", "Rapatriement", "Assistance 24h/7j", "RC a l'Etranger"],
      optionalGuarantees: ["Annulation", "Bagages"],
      exclusions: ["Zones de guerre"],
      duration: "30 jours",
      waitingPeriod: "Immediat",
      terms: "Conforme exigences visa Schengen.",
      rating: 4.6,
      isMandatory: true,
      tag: "Visa Schengen",
    },
    {
      id: "mrh-nsia",
      insurerSlug: "nsia-assurances",
      type: typeBySlug.get("multirisque-habitation")!,
      premium: 35000,
      coverageAmount: 20000000,
      franchise: 15000,
      guarantees: ["Incendie", "Degat des Eaux", "Vol avec Effraction"],
      optionalGuarantees: ["Responsabilite Civile Locataire", "Bris de Glace"],
      exclusions: ["Defaut d'entretien", "Guerre"],
      duration: "12 mois",
      waitingPeriod: "30 jours",
      terms: "Protection complete du logement.",
      rating: 4.4,
      isMandatory: false,
      tag: "Top Choix",
    },
    {
      id: "mrp-africaine",
      insurerSlug: "africaine-assurances",
      type: typeBySlug.get("multirisque-professionnelle")!,
      premium: 120000,
      coverageAmount: 50000000,
      franchise: 50000,
      guarantees: ["Incendie Bureaux", "Vol Stocks", "RC Exploitation"],
      optionalGuarantees: ["Pertes d'Exploitation", "Cyber Risques"],
      exclusions: ["Sinistre intentionnel"],
      duration: "12 mois",
      waitingPeriod: "30 jours",
      terms: "Couverture complete pour PME.",
      rating: 4.3,
      isMandatory: false,
      tag: "Entreprises",
    },
  ];

  const offerById = new Map<string, { id: string }>();

  for (const offer of offers) {
    const insurer = insurerBySlug.get(offer.insurerSlug);
    if (!insurer) continue;

    const created = await prisma.offer.upsert({
      where: { id: offer.id },
      update: {
        category: offer.type.category,
        insuranceTypeId: offer.type.id,
        insuranceTypeLabel: offer.type.label,
        insuranceSubType: offer.type.subType,
        insurerId: insurer.id,
        premium: offer.premium,
        billingPeriod: BillingPeriod.ANNUAL,
        coverageAmount: offer.coverageAmount,
        franchise: offer.franchise,
        guarantees: offer.guarantees,
        optionalGuarantees: offer.optionalGuarantees,
        exclusions: offer.exclusions,
        duration: offer.duration,
        waitingPeriod: offer.waitingPeriod,
        terms: offer.terms,
        rating: offer.rating,
        isMandatory: offer.isMandatory,
        tag: offer.tag,
      },
      create: {
        id: offer.id,
        category: offer.type.category,
        insuranceTypeId: offer.type.id,
        insuranceTypeLabel: offer.type.label,
        insuranceSubType: offer.type.subType,
        insurerId: insurer.id,
        premium: offer.premium,
        billingPeriod: BillingPeriod.ANNUAL,
        coverageAmount: offer.coverageAmount,
        franchise: offer.franchise,
        guarantees: offer.guarantees,
        optionalGuarantees: offer.optionalGuarantees,
        exclusions: offer.exclusions,
        duration: offer.duration,
        waitingPeriod: offer.waitingPeriod,
        terms: offer.terms,
        rating: offer.rating,
        isMandatory: offer.isMandatory,
        tag: offer.tag,
      },
      select: { id: true },
    });

    offerById.set(offer.id, created);
  }

  const africaine = insurerBySlug.get("africaine-assurances");
  const nobila = insurerBySlug.get("nobila-assurances");
  const sanlam = insurerBySlug.get("sanlam-allianz");
  const afg = insurerBySlug.get("afg-assurances");
  const cima = insurerBySlug.get("cima");

  const tariffRules = [];

  // --- AFRICAINE TARIFFS ---
  const AFRICAINE_TARIFFS_DATA = {
    "Promenade & Affaires": {
      "7-10 CV": {
        "Essence": { "1 MOIS": 21537, "2 MOIS": 26474, "3 MOIS": 31413, "6 MOIS": 38201, "1 AN": 54632 },
        "Diesel": { "1 MOIS": 24765, "2 MOIS": 30625, "3 MOIS": 36486, "6 MOIS": 44545, "1 AN": 63858 }
      },
      "11-14 CV": {
        "Essence": { "1 MOIS": 24765, "2 MOIS": 30625, "3 MOIS": 36486, "6 MOIS": 44545, "1 AN": 63858 },
        "Diesel": { "1 MOIS": 29610, "2 MOIS": 36855, "3 MOIS": 44097, "6 MOIS": 54059, "1 AN": 77697 }
      }
    },
    "Transport Propre Compte": {
      "7-10 CV": {
        "Essence": { "1 MOIS": 29556, "2 MOIS": 36784, "3 MOIS": 44013, "6 MOIS": 53953, "1 AN": 78142 },
        "Diesel": { "1 MOIS": 38171, "2 MOIS": 47861, "3 MOIS": 57552, "6 MOIS": 70876, "1 AN": 102758 }
      },
      "11-14 CV": {
        "Essence": { "1 MOIS": 38171, "2 MOIS": 47861, "3 MOIS": 57552, "6 MOIS": 70876, "1 AN": 102758 },
        "Diesel": { "1 MOIS": 46390, "2 MOIS": 58429, "3 MOIS": 70467, "6 MOIS": 87021, "1 AN": 126241 }
      }
    }
  };

  for (const [usage, powers] of Object.entries(AFRICAINE_TARIFFS_DATA)) {
    for (const [power, energies] of Object.entries(powers)) {
      for (const [energy, durations] of Object.entries(energies)) {
        for (const [duration, price] of Object.entries(durations)) {
          tariffRules.push({
            id: `auto-africaine-${usage}-${power}-${energy}-${duration}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            insurer: africaine,
            offer: offerById.get("auto-africaine"),
            price,
            usage,
            power,
            energy,
            duration,
            guarantees: ["RC", "DR", "IA"],
          });
        }
      }
    }
  }

  // --- NOBILA PA TARIFFS ---
  const NOBILA_PA_TARIFFS_DATA = {
    "7-10 CV": { "1 MOIS": 19966, "2 MOIS": 24927, "3 MOIS": 29886, "6 MOIS": 36707, "1 AN": 64609 },
    "11-14 CV": { "1 MOIS": 21449, "2 MOIS": 26834, "3 MOIS": 32217, "6 MOIS": 39621, "1 AN": 69907 },
  };

  for (const [power, durations] of Object.entries(NOBILA_PA_TARIFFS_DATA)) {
    for (const [duration, price] of Object.entries(durations)) {
      tariffRules.push({
        id: `auto-nobila-pa-${power}-${duration}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        insurer: nobila,
        offer: offerById.get("auto-nobila"),
        price,
        usage: "Promenade & Affaires",
        power,
        energy: null,
        duration,
        guarantees: ["RC", "DR", "IA", "CEDEAO"],
      });
    }
  }

  // --- NOBILA TPC TARIFFS ---
  const NOBILA_TPC_TARIFFS_DATA = {
    "7-10 CV": { "1 MOIS": 33126, "2 MOIS": 41272, "3 MOIS": 49303, "6 MOIS": 60155, "1 AN": 102274 },
    "11-14 CV": { "1 MOIS": 42625, "2 MOIS": 53484, "3 MOIS": 64229, "6 MOIS": 78813, "1 AN": 136198 },
  };

  for (const [power, durations] of Object.entries(NOBILA_TPC_TARIFFS_DATA)) {
    for (const [duration, price] of Object.entries(durations)) {
      tariffRules.push({
        id: `auto-nobila-tpc-${power}-${duration}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        insurer: nobila,
        offer: offerById.get("auto-nobila"),
        price,
        usage: "Transport Propre Compte",
        power,
        energy: null,
        duration,
        guarantees: ["RC", "DR", "IA", "CEDEAO"],
      });
    }
  }

  // --- CIMA PA TARIFFS ---
  const CIMA_PA_TARIFFS_DATA = {
    "7-10 CV": { "1 MOIS": 20740, "3 MOIS": 30797, "6 MOIS": 37708, "1 AN": 54633 },
    "11-14 CV": { "1 MOIS": 23975, "3 MOIS": 35872, "6 MOIS": 44051, "1 AN": 63859 },
  };

  for (const [power, durations] of Object.entries(CIMA_PA_TARIFFS_DATA)) {
    for (const [duration, price] of Object.entries(durations)) {
      tariffRules.push({
        id: `auto-cima-pa-${power}-${duration}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        insurer: cima,
        offer: offerById.get("auto-cima"),
        price,
        usage: "Promenade & Affaires",
        power,
        energy: null,
        duration,
        guarantees: ["RC", "DR", "IA"],
      });
    }
  }

  // --- MOTO TARIFFS ---
  const MOTO_TARIFFS = [
    {
      id: "moto-africaine-pa-1an",
      insurer: africaine,
      offer: offerById.get("moto-africaine"),
      price: 14772,
      guarantees: ["RC", "IA"],
    },
    {
      id: "moto-nobila-pa-1an",
      insurer: nobila,
      offer: offerById.get("moto-nobila"),
      price: 17303,
      guarantees: ["RC"],
    },
    {
      id: "moto-sanlam-pa-1an",
      insurer: sanlam,
      offer: offerById.get("moto-sanlam"),
      price: 17303,
      guarantees: ["RC", "DR"],
    },
  ];

  for (const moto of MOTO_TARIFFS) {
    tariffRules.push({
      id: moto.id,
      insurer: moto.insurer,
      offer: moto.offer,
      price: moto.price,
      usage: "Particulier",
      power: "Tous",
      energy: null,
      duration: "1 AN",
      guarantees: moto.guarantees,
      insuranceType: motoType,
    });
  }

  // --- VOYAGE TARIFFS ---
  if (afg) {
    tariffRules.push({
      id: "voyage-afg-schengen-30j",
      insurer: afg,
      offer: offerById.get("voyage-afg-schengen"),
      price: 17153,
      usage: "Schengen",
      duration: "30 JOURS",
      guarantees: ["Frais Medicaux", "Rapatriement"],
      insuranceType: typeBySlug.get("assurance-voyage"),
    });
  }

  for (const rule of tariffRules) {
    if (!rule.insurer) continue;
    const type = rule.insuranceType || autoType;

    await prisma.tariffRule.upsert({
      where: { id: rule.id },
      update: {
        offerId: rule.offer?.id,
        insurerId: rule.insurer.id,
        insuranceTypeId: type.id,
        category: type.category || InsuranceCategory.IARDT,
        insuranceTypeLabel: type.label,
        zone: "Zone Rouge",
        vehicleUsage: rule.usage,
        vehiclePower: rule.power,
        vehicleEnergy: rule.energy,
        duration: rule.duration,
        price: rule.price,
        guarantees: rule.guarantees,
      },
      create: {
        id: rule.id,
        offerId: rule.offer?.id,
        insurerId: rule.insurer.id,
        insuranceTypeId: type.id,
        category: type.category || InsuranceCategory.IARDT,
        insuranceTypeLabel: type.label,
        zone: "Zone Rouge",
        vehicleUsage: rule.usage,
        vehiclePower: rule.power,
        vehicleEnergy: rule.energy,
        duration: rule.duration,
        price: rule.price,
        guarantees: rule.guarantees,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
