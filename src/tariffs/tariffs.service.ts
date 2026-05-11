import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTariffRuleDto } from "./dto/create-tariff-rule.dto";
import { QueryTariffRulesDto } from "./dto/query-tariff-rules.dto";
import { UpdateTariffRuleDto } from "./dto/update-tariff-rule.dto";

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryTariffRulesDto) {
    const and: Prisma.TariffRuleWhereInput[] = [];

    if (query.category) and.push({ category: query.category });
    if (query.type && query.type !== "Tous") and.push({ insuranceTypeLabel: query.type });
    if (query.insurerSlug) and.push({ insurer: { slug: query.insurerSlug } });
    if (query.usage) and.push({ vehicleUsage: query.usage });
    if (query.power) and.push({ vehiclePower: query.power });
    if (query.energy) and.push({ vehicleEnergy: query.energy });
    if (query.duration) and.push({ duration: query.duration });
    if (query.active === "true") and.push({ active: true });
    if (query.active === "false") and.push({ active: false });

    return this.prisma.tariffRule.findMany({
      where: { AND: and },
      include: {
        insurer: true,
        offer: true,
        insuranceType: true,
      },
      orderBy: { price: "asc" },
    });
  }

  create(dto: CreateTariffRuleDto) {
    const data: Prisma.TariffRuleUncheckedCreateInput = {
      ...dto,
      zone: dto.zone ?? "Zone Rouge",
      currency: dto.currency ?? "XOF",
      guarantees: dto.guarantees ?? [],
      active: dto.active ?? true,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.tariffRule.create({ data });
  }

  async update(id: string, dto: UpdateTariffRuleDto) {
    await this.ensureExists(id);
    const data: Prisma.TariffRuleUncheckedUpdateInput = {
      ...dto,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.tariffRule.update({
      where: { id },
      data,
    });
  }

  private async ensureExists(id: string) {
    const rule = await this.prisma.tariffRule.findUnique({ where: { id }, select: { id: true } });
    if (!rule) {
      throw new NotFoundException("Tariff rule not found");
    }
  }
}
