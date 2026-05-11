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
    const data: Prisma.QuoteRequestUncheckedCreateInput = {
      ...dto,
      status: "NEW",
      payload: dto.payload as Prisma.InputJsonValue | undefined,
    };

    return this.prisma.quoteRequest.create({
      data,
    });
  }
}
