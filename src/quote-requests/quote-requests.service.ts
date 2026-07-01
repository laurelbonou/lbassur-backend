import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { BrokersService } from "../brokers/brokers.service";
import { PaginationQueryDto } from "../common/dto/pagination-query.dto";

@Injectable()
export class QuoteRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly brokersService: BrokersService,
  ) {}

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
    let signatureUrl: string | undefined = undefined;

    if (signatureData) {
      // Create uploads/signatures directory if not exists
      const fs = require('fs');
      const path = require('path');
      const signaturesDir = path.join(__dirname, '..', '..', '..', 'uploads', 'signatures');
      if (!fs.existsSync(signaturesDir)) {
        fs.mkdirSync(signaturesDir, { recursive: true });
      }
      
      const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length < 4 || buffer.toString('hex', 0, 4).toUpperCase() !== '89504E47') {
        throw new BadRequestException('Format de signature invalide. Seul le PNG est autorisé.');
      }

      const fileName = `sign-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
      fs.writeFileSync(path.join(signaturesDir, fileName), buffer);
      signatureUrl = `/uploads/signatures/${fileName}`;
    }

    // ── Resolve broker if code provided ──
    let brokerData: { brokerId?: string; brokerCode?: string; platformFee?: number; brokerShare?: number } = {};
    if (brokerCode) {
      const broker = await this.brokersService.findOrCreateByCode(brokerCode);
      const totalAmount = rest.budget || 0;
      const platformFee = Math.round((totalAmount * Number(broker.platformRate)) / 100);
      const brokerShare = totalAmount - platformFee;
      brokerData = {
        brokerId: broker.id,
        brokerCode: broker.code,
        platformFee,
        brokerShare,
      };
    }

    const data: Prisma.QuoteRequestCreateInput = {
      ...rest,
      status: "NEW",
      signatureUrl,
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
    let signatureUrl: string | undefined = undefined;

    if (signatureData) {
      const fs = require('fs');
      const path = require('path');
      const signaturesDir = path.join(__dirname, '..', '..', '..', 'uploads', 'signatures');
      if (!fs.existsSync(signaturesDir)) {
        fs.mkdirSync(signaturesDir, { recursive: true });
      }
      
      const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length < 4 || buffer.toString('hex', 0, 4).toUpperCase() !== '89504E47') {
        throw new BadRequestException('Format de signature invalide. Seul le PNG est autorisé.');
      }

      const fileName = `sign-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
      fs.writeFileSync(path.join(signaturesDir, fileName), buffer);
      signatureUrl = `/uploads/signatures/${fileName}`;
    }

    const dataToUpdate: Prisma.QuoteRequestUpdateInput = {
      ...rest,
      signatureUrl: signatureUrl || undefined,
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
