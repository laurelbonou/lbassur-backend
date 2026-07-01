import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { slugify } from "../common/slugify";
import { CreateBrokerDto, UpdateBrokerDto } from "./dto/broker.dto";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class BrokersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.broker.findMany({
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { quotes: true, commissions: true } },
        },
      }),
      this.prisma.broker.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCode(code: string) {
    const broker = await this.prisma.broker.findUnique({
      where: { code },
    });

    if (!broker) {
      throw new NotFoundException(`Courtier avec le code "${code}" introuvable`);
    }

    return broker;
  }

  async findBySlug(slug: string) {
    const broker = await this.prisma.broker.findUnique({
      where: { slug },
      include: {
        _count: { select: { quotes: true, commissions: true } },
      },
    });

    if (!broker) {
      throw new NotFoundException("Courtier introuvable");
    }

    return broker;
  }

  async create(dto: CreateBrokerDto) {
    // Verify code uniqueness
    const existing = await this.prisma.broker.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Un courtier avec le code "${dto.code}" existe déjà`);
    }

    const slug = dto.slug ?? slugify(dto.name);

    // Ensure commission rates sum to 100
    const commissionRate = dto.commissionRate ?? 70;
    const platformRate = dto.platformRate ?? (100 - commissionRate);

    return this.prisma.broker.create({
      data: {
        name: dto.name,
        code: dto.code,
        slug,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        commissionRate,
        platformRate,
      },
    });
  }

  async update(id: string, dto: UpdateBrokerDto) {
    await this.ensureExists(id);

    const data: any = { ...dto };
    if (dto.name && !dto.code) {
      data.slug = slugify(dto.name);
    }

    // If one rate changes, adjust the other to total 100
    if (dto.commissionRate !== undefined && dto.platformRate === undefined) {
      data.platformRate = 100 - dto.commissionRate;
    } else if (dto.platformRate !== undefined && dto.commissionRate === undefined) {
      data.commissionRate = 100 - dto.platformRate;
    }

    return this.prisma.broker.update({
      where: { id },
      data,
    });
  }

  /**
   * Look up or auto-create a broker by code.
   * Used during the subscription flow when a client enters a broker code.
   */
  async findOrCreateByCode(code: string, name?: string) {
    let broker = await this.prisma.broker.findUnique({ where: { code } });

    if (!broker) {
      // Auto-create with default rates
      broker = await this.prisma.broker.create({
        data: {
          name: name || `Courtier ${code}`,
          code,
          slug: slugify(name || `courtier-${code}`),
          commissionRate: 70,
          platformRate: 30,
        },
      });
    }

    return broker;
  }

  /**
   * Calculate commission split for a payment.
   * If the quote has a broker, split the commission.
   * If no broker (direct LBASSUR), 100% to LBASSUR.
   */
  async calculateCommission(paymentId: string, totalAmount: number, brokerId: string | null) {
    if (!brokerId) {
      // Direct LBASSUR subscription — 100% platform
      return this.prisma.commission.create({
        data: {
          paymentId,
          totalPremium: totalAmount,
          platformRate: 100,
          platformAmount: totalAmount,
          brokerRate: 0,
          brokerAmount: 0,
          brokerId: null,
          status: "PENDING",
        },
      });
    }

    const broker = await this.prisma.broker.findUnique({ where: { id: brokerId } });
    if (!broker || !broker.active) {
      // Broker inactive or not found — 100% platform
      return this.prisma.commission.create({
        data: {
          paymentId,
          totalPremium: totalAmount,
          platformRate: 100,
          platformAmount: totalAmount,
          brokerRate: 0,
          brokerAmount: 0,
          brokerId,
          status: "PENDING",
        },
      });
    }

    const platformRate = Number(broker.platformRate);
    const brokerRate = Number(broker.commissionRate);
    const platformAmount = Math.round((totalAmount * platformRate) / 100);
    const brokerAmount = totalAmount - platformAmount; // Ensures no rounding loss

    return this.prisma.commission.create({
      data: {
        paymentId,
        totalPremium: totalAmount,
        platformRate,
        platformAmount,
        brokerRate,
        brokerAmount,
        brokerId,
        status: "PENDING",
      },
    });
  }

  /**
   * Get commission summary for admin dashboard.
   */
  async getCommissionSummary(query: PaginationQueryDto & { brokerId?: string; status?: string }) {
    const { page = 1, limit = 20, brokerId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (brokerId) where.brokerId = brokerId;
    if (status) where.status = status;

    const [data, total, totals] = await Promise.all([
      this.prisma.commission.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          broker: { select: { name: true, code: true } },
          payment: {
            select: {
              reference: true,
              quoteRequest: { select: { fullName: true, insuranceType: true } },
            },
          },
        },
      }),
      this.prisma.commission.count({ where }),
      this.prisma.commission.aggregate({
        where,
        _sum: {
          totalPremium: true,
          platformAmount: true,
          brokerAmount: true,
        },
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      totals: {
        totalPremium: totals._sum.totalPremium || 0,
        platformAmount: totals._sum.platformAmount || 0,
        brokerAmount: totals._sum.brokerAmount || 0,
      },
    };
  }

  private async ensureExists(id: string) {
    const broker = await this.prisma.broker.findUnique({ where: { id }, select: { id: true } });
    if (!broker) {
      throw new NotFoundException("Courtier introuvable");
    }
  }
}
