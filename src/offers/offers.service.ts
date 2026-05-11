import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { QueryOffersDto } from "./dto/query-offers.dto";
import { UpdateOfferDto } from "./dto/update-offer.dto";

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryOffersDto) {
    const and: Prisma.OfferWhereInput[] = [];

    if (query.category) and.push({ category: query.category });
    if (query.type && query.type !== "Tous") and.push({ insuranceTypeLabel: query.type });
    if (query.insurerSlug) and.push({ insurer: { slug: query.insurerSlug } });
    if (query.maxPremium) and.push({ premium: { lte: Number(query.maxPremium) } });
    if (query.q) {
      and.push({
        OR: [
          { insurer: { name: { contains: query.q, mode: "insensitive" } } },
          { insuranceTypeLabel: { contains: query.q, mode: "insensitive" } },
          { insuranceSubType: { contains: query.q, mode: "insensitive" } },
        ],
      });
    }

    const orderBy: Prisma.OfferOrderByWithRelationInput =
      query.sortBy === "rating"
        ? { rating: "desc" }
        : query.sortBy === "coverage"
          ? { coverageAmount: "desc" }
          : { premium: "asc" };

    return this.prisma.offer.findMany({
      where: {
        status: query.status ?? "ACTIVE",
        AND: and,
      },
      include: {
        insurer: true,
        insuranceType: true,
      },
      orderBy,
    });
  }

  async findOne(id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        insurer: true,
        insuranceType: true,
        guaranteeLinks: {
          include: { guarantee: true },
        },
        tariffRules: true,
      },
    });

    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    return offer;
  }

  create(dto: CreateOfferDto) {
    const data: Prisma.OfferUncheckedCreateInput = {
      ...dto,
      billingPeriod: dto.billingPeriod ?? "ANNUAL",
      franchise: dto.franchise ?? 0,
      guarantees: dto.guarantees ?? [],
      optionalGuarantees: dto.optionalGuarantees ?? [],
      exclusions: dto.exclusions ?? [],
      duration: dto.duration ?? "12 mois",
      waitingPeriod: dto.waitingPeriod ?? "Immediat",
      rating: dto.rating ?? 0,
      isMandatory: dto.isMandatory ?? false,
      status: dto.status ?? "ACTIVE",
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.offer.create({
      data,
    });
  }

  async update(id: string, dto: UpdateOfferDto) {
    await this.ensureExists(id);
    const data: Prisma.OfferUncheckedUpdateInput = {
      ...dto,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.offer.update({
      where: { id },
      data,
    });
  }

  private async ensureExists(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id }, select: { id: true } });
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }
  }
}
