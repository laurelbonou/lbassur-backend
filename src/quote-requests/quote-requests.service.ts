import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { BrokersService } from "../brokers/brokers.service";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";
import { CloudinaryService, STORAGE_FOLDERS } from "../storage/cloudinary.service";

/** Signature manuscrite : data URL produite par le canvas du formulaire. */
const PNG_MAGIC = "89504E47";

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly brokersService: BrokersService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Dépose la signature manuscrite sur Cloudinary et renvoie son publicId.
   * Elle n'est plus écrite sur disque : les PDF générés la récupèrent depuis
   * Cloudinary au moment de leur composition.
   */
  private async storeSignature(signatureData: string): Promise<string> {
    const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length < 4 || buffer.toString("hex", 0, 4).toUpperCase() !== PNG_MAGIC) {
      throw new BadRequestException("Format de signature invalide. Seul le PNG est autorisé.");
    }

    const asset = await this.cloudinary.uploadBuffer(buffer, {
      folder: STORAGE_FOLDERS.signatures,
      mimeType: "image/png",
    });

    return asset.publicId;
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          documents: true,
          payment: true,
        }
      }),
      this.prisma.quoteRequest.count(),
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

  async findOne(id: string) {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        documents: true,
        payment: true,
      }
    });
    if (!quote) throw new NotFoundException("Quote not found");
    return quote;
  }

  async create(dto: CreateQuoteRequestDto) {
    const { documents, signatureData, brokerCode, ...rest } = dto;

    const signaturePublicId = signatureData
      ? await this.storeSignature(signatureData)
      : undefined;

    // ── Resolve broker if code provided ──
    // Le code saisi est toujours conservé sur le devis, même s'il ne correspond
    // à aucun intermédiaire connu : on ne bloque pas le client, un administrateur
    // pourra rattacher le dossier manuellement. Tant que le rattachement n'est pas
    // fait, aucune part n'est réservée et la prime revient intégralement à LBASSUR.
    let brokerData: { brokerId?: string; brokerCode?: string; platformFee?: number; brokerShare?: number } = {};
    if (brokerCode) {
      brokerData.brokerCode = brokerCode.trim();

      const broker = await this.brokersService.tryResolveByCode(brokerCode);
      if (broker) {
        const full = await this.prisma.broker.findUnique({
          where: { id: broker.id },
          select: { id: true, platformRate: true },
        });
        if (full) {
          brokerData.brokerId = full.id;
          // Taux non négocié : on rattache l'intermédiaire mais on ne chiffre
          // aucune part. Number(null) valant 0, calculer ici reviendrait à lui
          // promettre 100 % de la prime.
          if (full.platformRate !== null) {
            const totalAmount = rest.budget || 0;
            const platformFee = Math.round((totalAmount * Number(full.platformRate)) / 100);
            brokerData.platformFee = platformFee;
            brokerData.brokerShare = totalAmount - platformFee;
          }
        }
      }
    }

    const data: Prisma.QuoteRequestCreateInput = {
      ...rest,
      status: "NEW",
      signaturePublicId,
      payload: rest.payload as Prisma.InputJsonValue | undefined,
      ...( brokerData.brokerId ? { broker: { connect: { id: brokerData.brokerId } } } : {} ),
      brokerCode: brokerData.brokerCode,
      platformFee: brokerData.platformFee,
      brokerShare: brokerData.brokerShare,
      documents: documents?.length
        ? {
            create: documents.map((doc) => ({
              type: doc.type,
              filename: doc.filename,
              publicId: doc.publicId,
              resourceType: doc.resourceType,
              format: doc.format,
              url: doc.url,
              mimeType: doc.mimeType,
              size: doc.size,
            })),
          }
        : undefined,
    };

    return this.prisma.quoteRequest.create({
      data,
      include: {
        documents: true,
        broker: true,
      },
    });
  }

  async createDraft(dto: CreateQuoteRequestDto) {
    const client = await this.prisma.client.upsert({
      where: { phone: dto.phone },
      update: {
        fullName: dto.fullName || undefined,
        email: dto.email || undefined,
      },
      create: {
        phone: dto.phone,
        fullName: dto.fullName,
        email: dto.email,
      }
    });

    const data: Prisma.QuoteRequestCreateInput = {
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      status: "DRAFT",
      client: { connect: { id: client.id } }
    };

    const draft = await this.prisma.quoteRequest.create({
      data,
    });

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@lbassur.bj";
    this.notificationsService.notifyAdminAbandonedCart(adminEmail, draft).catch(err => {
      console.error("Failed to notify admin of abandoned cart:", err);
    });

    return draft;
  }

  async update(id: string, dto: Partial<CreateQuoteRequestDto>) {
    const { documents, signatureData, ...rest } = dto;

    const signaturePublicId = signatureData
      ? await this.storeSignature(signatureData)
      : undefined;

    const dataToUpdate: Prisma.QuoteRequestUpdateInput = {
      ...rest,
      signaturePublicId,
      payload: rest.payload ? (rest.payload as Prisma.InputJsonValue) : undefined,
    };

    // If changing from DRAFT to NEW
    if (rest.selectedOfferId) {
      dataToUpdate.status = "NEW";
    }

    return this.prisma.quoteRequest.update({
      where: { id },
      data: {
        ...dataToUpdate,
        documents: documents?.length
          ? {
              create: documents.map((doc) => ({
                type: doc.type,
                filename: doc.filename,
                publicId: doc.publicId,
                resourceType: doc.resourceType,
                format: doc.format,
                url: doc.url,
                mimeType: doc.mimeType,
                size: doc.size,
              })),
            }
          : undefined,
      },
      include: {
        documents: true,
      },
    });
  }
}
