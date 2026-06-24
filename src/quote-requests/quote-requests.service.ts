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
    });
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
