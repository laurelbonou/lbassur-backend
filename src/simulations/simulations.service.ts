import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AutoSimulationDto } from "./dto/auto-simulation.dto";
import { InsuranceCategory } from "@prisma/client";

@Injectable()
export class SimulationsService {
  constructor(private readonly prisma: PrismaService) {}

  async simulate(category: string, typeLabel: string, criteria: any) {
    const zone = criteria.zone ?? "Zone Rouge";
    
    // Base filters for all simulations
    const where: any = {
      active: true,
      category: category as InsuranceCategory,
      insuranceTypeLabel: typeLabel,
      zone,
    };

    // Specific filters for Automobile
    if (typeLabel === "Assurance Automobile" || typeLabel === "Assurance Moto") {
      if (criteria.usage) where.vehicleUsage = criteria.usage;
      if (criteria.power) where.vehiclePower = criteria.power;
      if (criteria.duration) where.duration = criteria.duration;
      if (criteria.energy) {
        where.OR = [{ vehicleEnergy: criteria.energy }, { vehicleEnergy: null }];
      }
    }

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
      input: { ...criteria, category, typeLabel, zone },
      count: rules.length,
      results: rules.map((rule) => ({
        id: rule.id,
        insurer: rule.insurer.name,
        insurerSlug: rule.insurer.slug,
        logoUrl: rule.insurer.logoUrl,
        offerId: rule.offerId,
        price: rule.price,
        currency: rule.currency,
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
