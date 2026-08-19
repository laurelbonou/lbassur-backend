import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AutoSimulationDto } from "./dto/auto-simulation.dto";
import { InsuranceCategory, PricingStatus, Prisma } from "@prisma/client";

type SimulationCriteria = {
  zone?: string;
  usage?: string;
  power?: string;
  duration?: string;
  energy?: string;
  pricingStatus?: PricingStatus;
};

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaService) {}

  async simulate(category: string, typeLabel: string, criteria: SimulationCriteria) {
    // Base filters for all simulations
    const where: Prisma.TariffRuleWhereInput = {
      active: true,
      category: category as InsuranceCategory,
      insuranceTypeLabel: typeLabel,
      ...(criteria.zone ? { zone: criteria.zone } : {}),
    };

    // Chaque condition « valeur précise OU non renseignée » doit vivre dans son
    // propre OR : deux affectations de `where.OR` s'écraseraient l'une l'autre.
    const anyOf: Prisma.TariffRuleWhereInput[] = [];

    // Specific filters for Automobile
    if (typeLabel === "Assurance Automobile" || typeLabel === "Assurance Moto") {
      if (criteria.usage) where.vehicleUsage = criteria.usage;
      if (criteria.power) where.vehiclePower = criteria.power;
      if (criteria.duration) where.duration = criteria.duration;

      if (criteria.pricingStatus) {
        // Seul AFG différencie ses tarifs par zone de risque. Les autres
        // compagnies pratiquent le même prix partout et laissent `pricingStatus`
        // vide — les exclure reviendrait à ne comparer qu'un seul assureur dès
        // que le client précise sa zone.
        anyOf.push({
          OR: [{ pricingStatus: criteria.pricingStatus }, { pricingStatus: null }],
        });
      }

      if (criteria.energy) {
        anyOf.push({
          OR: [{ vehicleEnergy: criteria.energy }, { vehicleEnergy: null }],
        });
      }
    }

    if (anyOf.length) where.AND = anyOf;

    const rules = await this.prisma.tariffRule.findMany({
      where,
      include: {
        insurer: true,
        offer: {
          include: {
            guaranteeLinks: {
              include: {
                guarantee: true
              }
            }
          }
        },
      },
      orderBy: {
        price: "asc",
      },
    });

    return {
      input: { ...criteria, category, typeLabel },
      count: rules.length,
      results: rules.map((rule) => ({
        id: rule.id,
        insurer: rule.insurer.name,
        insurerSlug: rule.insurer.slug,
        logoUrl: rule.insurer.logoUrl,
        offerId: rule.offerId,
        price: rule.price,
        currency: rule.currency,
        // Deux lignes d'une même compagnie ne se distinguent souvent que par
        // ces deux champs : sans eux, le comparateur affiche deux fois le même
        // assureur à 11 000 F d'écart, sans rien pour l'expliquer.
        //
        // Le bonus porte sur la prime RC seule, pas sur le total taxes et
        // accessoires comprises : ne jamais en déduire une économie affichée.
        bonusRate: rule.bonusRate,
        pricingStatus: rule.pricingStatus,
        guarantees: rule.guarantees.length > 0 ? rule.guarantees : rule.offer?.guarantees ?? [],
        tag: rule.offer?.tag,
        rating: rule.offer?.rating,
        details: rule.offer ? {
          coverageAmount: rule.offer.coverageAmount,
          franchise: rule.offer.franchise,
          waitingPeriod: rule.offer.waitingPeriod,
          duration: rule.offer.duration,
          guarantees: rule.offer.guaranteeLinks.map(g => ({
            name: g.guarantee.name,
            included: g.included,
            details: g.details
          }))
        } : null
      })),
    };
  }

  async simulateAuto(dto: AutoSimulationDto) {
    return this.simulate("IARDT", "Assurance Automobile", dto);
  }
}
