import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getMyQuotes(clientId: string) {
    return this.prisma.quoteRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { documents: true, payment: true },
    });
  }

  async getMyClaims(clientId: string) {
    return this.prisma.claim.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { quoteRequest: true },
    });
  }

  async createClaim(clientId: string, dto: any) {
    return this.prisma.claim.create({
      data: {
        clientId,
        quoteRequestId: dto.quoteRequestId || undefined,
        description: dto.description,
        incidentDate: new Date(dto.incidentDate),
        status: 'PENDING',
      },
    });
  }

  // Admin methods
  async getAllClaims() {
    return this.prisma.claim.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true, quoteRequest: true },
    });
  }

  async updateClaimStatus(id: string, status: any) {
    return this.prisma.claim.update({
      where: { id },
      data: { status },
      include: { client: true, quoteRequest: true },
    });
  }
}
