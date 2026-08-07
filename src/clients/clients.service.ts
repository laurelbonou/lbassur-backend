import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ClaimStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { CloudinaryService } from '../storage/cloudinary.service';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private cloudinary: CloudinaryService,
  ) {}

  /**
   * Remplace la référence Cloudinary par une URL de consultation signée et
   * expirante. Générée à la lecture : stocker l'URL la rendrait périmée.
   * Les pièces d'avant la bascule gardent leur ancien chemin `/uploads/...`.
   */
  private withSignedUrls<T extends { attachments?: any[] }>(claim: T): T {
    if (!claim?.attachments) return claim;
    return {
      ...claim,
      attachments: claim.attachments.map((file) => ({
        ...file,
        url: file.publicId
          ? this.cloudinary.signedUrl({
              publicId: file.publicId,
              resourceType: file.resourceType ?? 'image',
              format: file.format,
            })
          : file.url,
      })),
    };
  }

  async getMyQuotes(clientId: string) {
    return this.prisma.quoteRequest.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { documents: true, payment: true },
    });
  }

  async getMyClaims(clientId: string) {
    const claims = await this.prisma.claim.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { quoteRequest: true, attachments: true },
    });
    return claims.map((claim) => this.withSignedUrls(claim));
  }

  async createClaim(clientId: string, dto: CreateClaimDto) {
    // Un client ne rattache un sinistre qu'à l'un de SES contrats. Sans ce
    // contrôle, un ID de contrat valide suffisait à greffer un sinistre sur le
    // dossier de quelqu'un d'autre.
    if (dto.quoteRequestId) {
      const ownedQuote = await this.prisma.quoteRequest.findFirst({
        where: { id: dto.quoteRequestId, clientId },
        select: { id: true },
      });
      // Volontairement « introuvable » et non « interdit » : la réponse ne doit
      // pas révéler l'existence d'un contrat appartenant à un autre client.
      if (!ownedQuote) {
        throw new NotFoundException("Contrat introuvable.");
      }
    }

    const incidentDate = new Date(dto.incidentDate);
    if (incidentDate.getTime() > Date.now()) {
      throw new BadRequestException(
        "La date du sinistre ne peut pas être dans le futur.",
      );
    }

    // Les fichiers sont d'abord envoyés à POST /uploads, qui les dépose sur
    // Cloudinary et renvoie leur publicId. Le client ne transmet ici que cette
    // référence — jamais d'URL, qui serait fabriquée côté serveur de toute façon.
    const attachments = dto.attachments ?? [];

    const claim = await this.prisma.claim.create({
      data: {
        clientId,
        quoteRequestId: dto.quoteRequestId || undefined,
        description: dto.description,
        incidentDate,
        status: 'PENDING',

        claimType: dto.claimType || undefined,
        incidentTime: dto.incidentTime || undefined,
        locationCity: dto.locationCity || undefined,
        locationDetails: dto.locationDetails || undefined,

        hasInjuries: Boolean(dto.hasInjuries),
        hasAmicableReport: Boolean(dto.hasAmicableReport),
        hasPoliceReport: Boolean(dto.hasPoliceReport),
        policeReportRef: dto.policeReportRef || undefined,

        thirdPartyName: dto.thirdPartyName || undefined,
        thirdPartyPlate: dto.thirdPartyPlate || undefined,
        thirdPartyInsurer: dto.thirdPartyInsurer || undefined,
        thirdPartyPolicy: dto.thirdPartyPolicy || undefined,

        attachments: attachments.length
          ? {
              create: attachments.map((file) => ({
                kind: file.kind,
                filename: file.filename,
                publicId: file.publicId,
                resourceType: file.resourceType,
                format: file.format,
                mimeType: file.mimeType,
                size: file.size,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    });

    return this.withSignedUrls(claim);
  }

  // Admin methods
  async getAllClaims() {
    const claims = await this.prisma.claim.findMany({
      orderBy: { createdAt: 'desc' },
      include: { client: true, quoteRequest: true, attachments: true },
    });
    return claims.map((claim) => this.withSignedUrls(claim));
  }

  async getClaim(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: { client: true, quoteRequest: true, attachments: true },
    });
    if (!claim) throw new NotFoundException("Sinistre introuvable.");
    return this.withSignedUrls(claim);
  }

  async updateClaimStatus(id: string, status: ClaimStatus) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!claim) throw new NotFoundException("Sinistre introuvable.");

    const updated = await this.prisma.claim.update({
      where: { id },
      data: { status },
      include: { client: true, quoteRequest: true, attachments: true },
    });
    return this.withSignedUrls(updated);
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
