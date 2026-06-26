import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

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

  // --- Profile Change Requests ---

  async getMyChangeRequests(clientId: string) {
    return this.prisma.profileChangeRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createChangeRequest(clientId: string, dto: any) {
    return this.prisma.profileChangeRequest.create({
      data: {
        clientId,
        requestedData: dto.requestedData,
        proofDocumentUrl: dto.proofDocumentUrl,
        status: 'PENDING',
      },
    });
  }

  // Admin methods for change requests
  async getAllChangeRequests() {
    return this.prisma.profileChangeRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    });
  }

  async updateChangeRequestStatus(id: string, status: any, adminNote?: string) {
    const request = await this.prisma.profileChangeRequest.update({
      where: { id },
      data: { status, adminNote },
      include: { client: true },
    });

    if (status === 'APPROVED' && request.requestedData) {
      // Apply the changes to the client profile
      const dataToUpdate = request.requestedData as any;
      const updatePayload: any = {};
      if (dataToUpdate.fullName) updatePayload.fullName = dataToUpdate.fullName;
      if (dataToUpdate.email) updatePayload.email = dataToUpdate.email;
      if (dataToUpdate.phone) updatePayload.phone = dataToUpdate.phone;

      if (Object.keys(updatePayload).length > 0) {
        await this.prisma.client.update({
          where: { id: request.clientId },
          data: updatePayload,
        });
      }
    }

    // Notify client by email
    const clientEmail = (request as any).client?.email;
    if (clientEmail) {
      this.notificationsService.notifyClientProfileRequestUpdate(clientEmail, status, adminNote).catch(err => {
        console.error("Failed to notify client of profile request update:", err);
      });
    }

    return request;
  }
}
