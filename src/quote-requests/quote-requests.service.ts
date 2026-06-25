import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateQuoteRequestDto } from "./dto/create-quote-request.dto";

@Injectable()
export class QuoteRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.quoteRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        documents: true,
        payment: true,
      }
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        documents: true,
        payment: true,
      }
    });
    if (!quote) throw new Error("Quote not found");
    return quote;
  }

  create(dto: CreateQuoteRequestDto) {
    const { documents, ...rest } = dto;
    const data: Prisma.QuoteRequestCreateInput = {
      ...rest,
      status: "NEW",
      payload: rest.payload as Prisma.InputJsonValue | undefined,
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
      },
    });
  }
}
