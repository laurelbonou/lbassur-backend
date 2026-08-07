import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { slugify } from "../common/slugify";
import { CreateBrokerDto, UpdateBrokerDto, QueryBrokersDto } from "./dto/broker.dto";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { IntermediaryType, Prisma } from "@prisma/client";

/** Champs exposés publiquement — jamais les taux de commission. */
const PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  type: true,
  city: true,
  region: true,
  contactPhone: true,
  insurer: { select: { id: true, name: true, slug: true, logoUrl: true } },
  insurerCodes: {
    where: { active: true },
    select: { code: true, insurer: { select: { slug: true, name: true } } },
  },
} satisfies Prisma.BrokerSelect;

@Injectable()
export class BrokersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  /**
   * Liste publique des intermédiaires, pour que le client choisisse le sien
   * pendant la souscription.
   *
   * Règle métier : un COURTIER est libre de placer chez n'importe quelle
   * compagnie, alors qu'un AGENT_GENERAL ne peut vendre que les produits de
   * sa compagnie mandante. Donc, quand la souscription porte sur un assureur
   * donné (`insurerSlug`), on retourne tous les courtiers + uniquement les
   * agents généraux de CET assureur.
   */
  async findPublic(query: QueryBrokersDto) {
    const { page = 1, limit = 50, search, type, insurerSlug, city } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BrokerWhereInput = { active: true };

    if (type) where.type = type;
    if (city) where.city = { equals: city, mode: "insensitive" };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { insurerCodes: { some: { code: { contains: search }, active: true } } },
      ];
    }

    if (insurerSlug) {
      where.AND = [
        {
          OR: [
            { type: IntermediaryType.COURTIER },
            { type: IntermediaryType.AGENT_GENERAL, insurer: { slug: insurerSlug } },
          ],
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.broker.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ type: "asc" }, { name: "asc" }],
        select: PUBLIC_SELECT,
      }),
      this.prisma.broker.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Résout un code d'intermédiaire.
   *
   * Un code n'a de sens qu'au sein d'une compagnie : "3610" désigne LABASSUR
   * chez L'Africaine, mais peut désigner un tout autre cabinet chez NSIA.
   * Sans `insurerSlug`, on cherche donc dans toutes les compagnies et on ne
   * tranche que si le code est sans ambiguïté.
   */
  async resolveByCode(code: string, insurerSlug?: string) {
    const matches = await this.prisma.brokerInsurerCode.findMany({
      where: {
        code: code.trim(),
        active: true,
        ...(insurerSlug ? { insurer: { slug: insurerSlug } } : {}),
      },
      select: {
        code: true,
        insurer: { select: { id: true, name: true, slug: true } },
        broker: { select: PUBLIC_SELECT },
      },
    });

    if (matches.length === 0) {
      throw new NotFoundException(`Aucun intermédiaire ne porte le code "${code}"`);
    }

    if (matches.length > 1) {
      throw new ConflictException({
        message: `Le code "${code}" est utilisé par plusieurs compagnies. Précisez la compagnie.`,
        candidates: matches.map((m) => ({ insurer: m.insurer, broker: m.broker })),
      });
    }

    return { ...matches[0].broker, matchedCode: matches[0].code, matchedInsurer: matches[0].insurer };
  }

  /**
   * Variante non bloquante utilisée par le tunnel de souscription : renvoie
   * `null` au lieu de lever si le code est inconnu ou ambigu, pour ne jamais
   * bloquer un client. Le code saisi reste conservé sur le devis afin qu'un
   * administrateur puisse le rattacher manuellement.
   */
  async tryResolveByCode(code: string, insurerSlug?: string) {
    try {
      return await this.resolveByCode(code, insurerSlug);
    } catch {
      return null;
    }
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async findAll(query: QueryBrokersDto) {
    const { page = 1, limit = 20, search, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BrokerWhereInput = {};
    if (type) where.type = type;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [data, total] = await Promise.all([
      this.prisma.broker.findMany({
        skip,
        take: limit,
        where,
        orderBy: [{ type: "asc" }, { name: "asc" }],
        include: {
          insurer: { select: { id: true, name: true, slug: true } },
          insurerCodes: { include: { insurer: { select: { name: true, slug: true } } } },
          _count: { select: { quotes: true, commissions: true } },
        },
      }),
      this.prisma.broker.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findBySlug(slug: string) {
    const broker = await this.prisma.broker.findUnique({
      where: { slug },
      include: {
        insurer: { select: { id: true, name: true, slug: true } },
        insurerCodes: { include: { insurer: { select: { name: true, slug: true } } } },
        _count: { select: { quotes: true, commissions: true } },
      },
    });

    if (!broker) throw new NotFoundException("Intermédiaire introuvable");
    return broker;
  }

  async create(dto: CreateBrokerDto) {
    const type = dto.type ?? IntermediaryType.COURTIER;

    // Un agent général est le mandataire d'une seule compagnie : sans elle,
    // impossible de savoir quels produits il a le droit de distribuer.
    if (type === IntermediaryType.AGENT_GENERAL && !dto.insurerId) {
      throw new BadRequestException("Un agent général doit être rattaché à une compagnie (insurerId)");
    }
    if (type === IntermediaryType.COURTIER && dto.insurerId) {
      throw new BadRequestException(
        "Un courtier ne peut être rattaché à une compagnie : il travaille avec plusieurs assureurs",
      );
    }

    const slug = dto.slug ?? slugify(dto.name);
    if (await this.prisma.broker.findUnique({ where: { slug }, select: { id: true } })) {
      throw new ConflictException(`Un intermédiaire avec le slug "${slug}" existe déjà`);
    }

    // Aucun taux par défaut : tant qu'il n'est pas négocié, il reste NULL.
    const commissionRate =
      dto.commissionRate ?? (dto.platformRate !== undefined ? 100 - dto.platformRate : null);
    const platformRate =
      dto.platformRate ?? (dto.commissionRate !== undefined ? 100 - dto.commissionRate : null);

    return this.prisma.broker.create({
      data: {
        name: dto.name,
        slug,
        type,
        insurerId: dto.insurerId ?? null,
        approvalRank: dto.approvalRank,
        approvalYear: dto.approvalYear,
        city: dto.city,
        region: dto.region,
        address: dto.address,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        commissionRate,
        platformRate,
      },
    });
  }

  async update(id: string, dto: UpdateBrokerDto) {
    await this.ensureExists(id);

    const data: Prisma.BrokerUpdateInput = { ...dto } as Prisma.BrokerUpdateInput;
    if (dto.name && !dto.slug) data.slug = slugify(dto.name);

    // Les deux taux doivent toujours totaliser 100.
    if (dto.commissionRate !== undefined && dto.platformRate === undefined) {
      data.platformRate = 100 - dto.commissionRate;
    } else if (dto.platformRate !== undefined && dto.commissionRate === undefined) {
      data.commissionRate = 100 - dto.platformRate;
    }

    return this.prisma.broker.update({ where: { id }, data });
  }

  /** Attribue (ou met à jour) le code d'un intermédiaire chez une compagnie. */
  async setInsurerCode(brokerId: string, insurerId: string, code: string) {
    await this.ensureExists(brokerId);

    const clash = await this.prisma.brokerInsurerCode.findUnique({
      where: { insurerId_code: { insurerId, code } },
      select: { brokerId: true },
    });
    if (clash && clash.brokerId !== brokerId) {
      throw new ConflictException(`Le code "${code}" est déjà attribué chez cette compagnie`);
    }

    return this.prisma.brokerInsurerCode.upsert({
      where: { brokerId_insurerId: { brokerId, insurerId } },
      update: { code },
      create: { brokerId, insurerId, code },
    });
  }

  // ── Commissions ────────────────────────────────────────────────────────────

  /**
   * Répartit la prime entre LBASSUR et l'intermédiaire.
   * Sans intermédiaire (souscription directe), 100 % revient à la plateforme.
   */
  async calculateCommission(paymentId: string, totalAmount: number, brokerId: string | null) {
    const broker = brokerId
      ? await this.prisma.broker.findUnique({ where: { id: brokerId } })
      : null;

    // Intermédiaire absent ou désactivé : rien à reverser.
    if (!broker || !broker.active) {
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

    // Intermédiaire identifié mais taux jamais négocié : on n'invente pas de
    // répartition. Rien n'est alloué, ni à lui ni à nous, et le dossier est
    // marqué pour arbitrage. Attention : Number(null) vaut 0, donc un simple
    // Number() sur un taux nul reverserait la totalité à l'intermédiaire.
    if (broker.platformRate === null || broker.commissionRate === null) {
      return this.prisma.commission.create({
        data: {
          paymentId,
          totalPremium: totalAmount,
          platformRate: 0,
          platformAmount: 0,
          brokerRate: 0,
          brokerAmount: 0,
          brokerId,
          status: "RATE_UNDEFINED",
        },
      });
    }

    const platformRate = Number(broker.platformRate);
    const brokerRate = Number(broker.commissionRate);
    const platformAmount = Math.round((totalAmount * platformRate) / 100);
    const brokerAmount = totalAmount - platformAmount; // évite toute perte à l'arrondi

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

  async getCommissionSummary(query: PaginationQueryDto & { brokerId?: string; status?: string }) {
    const { page = 1, limit = 20, brokerId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {};
    if (brokerId) where.brokerId = brokerId;
    if (status) where.status = status as Prisma.EnumCommissionStatusFilter["equals"];

    const [data, total, totals] = await Promise.all([
      this.prisma.commission.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
        include: {
          broker: { select: { name: true, type: true, slug: true } },
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
        _sum: { totalPremium: true, platformAmount: true, brokerAmount: true },
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
    if (!broker) throw new NotFoundException("Intermédiaire introuvable");
  }
}
