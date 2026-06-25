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
    const { documents, signatureData, ...rest } = dto;
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
      const fileName = `sign-${Date.now()}-${Math.floor(Math.random() * 1000)}.png`;
      fs.writeFileSync(path.join(signaturesDir, fileName), buffer);
      signatureUrl = `/uploads/signatures/${fileName}`;
    }

    const data: Prisma.QuoteRequestCreateInput = {
      ...rest,
      status: "NEW",
      signatureUrl,
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
