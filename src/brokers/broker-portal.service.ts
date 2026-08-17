import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Données de l'espace partenaires.
 *
 * Règle unique et non négociable de ce fichier : **toute requête est filtrée
 * sur `brokerId`**. Les courtiers sont concurrents entre eux ; une requête
 * oubliée ici n'est pas une fuite technique, c'est le portefeuille commercial
 * d'un cabinet livré à un autre.
 *
 * Aucune méthode ne doit accepter d'identifiant de cabinet venant du client :
 * le `brokerId` provient du jeton vérifié, jamais d'un paramètre de requête.
 */
@Injectable()
export class BrokerPortalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fiche du cabinet connecté. */
  async profil(brokerId: string) {
    const broker = await this.prisma.broker.findUnique({
      where: { id: brokerId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        acabNumber: true,
        acabStatus: true,
        acabSyncedAt: true,
        approvalRank: true,
        approvalYear: true,
        city: true,
        region: true,
        contactEmail: true,
        contactPhone: true,
        commissionRate: true,
        active: true,
        insurer: { select: { id: true, name: true } },
      },
    });
    if (!broker) throw new NotFoundException('Cabinet introuvable.');
    return broker;
  }

  /**
   * Contrats apportés par ce cabinet.
   *
   * On ne renvoie ni `payload` ni les URL de documents : le premier contient
   * la totalité du formulaire de souscription, les secondes sont des liens
   * signés. Ni l'un ni l'autre n'a sa place dans une liste.
   */
  async contrats(brokerId: string) {
    return this.prisma.quoteRequest.findMany({
      where: { brokerId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        category: true,
        insuranceType: true,
        status: true,
        policyNumber: true,
        budget: true,
        brokerShare: true,
        createdAt: true,
        payment: { select: { status: true, amount: true, updatedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /** Commissions dues à ce cabinet. */
  async commissions(brokerId: string) {
    return this.prisma.commission.findMany({
      where: { brokerId },
      select: {
        id: true,
        totalPremium: true,
        brokerRate: true,
        brokerAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  /**
   * Chiffres de tête de tableau de bord.
   *
   * Les commissions en RATE_UNDEFINED sont comptées à part : leur taux n'a pas
   * encore été négocié, et les additionner au montant dû afficherait une somme
   * que LBASSUR n'a jamais promise.
   */
  async synthese(brokerId: string) {
    const [contrats, parStatut] = await Promise.all([
      this.prisma.quoteRequest.count({ where: { brokerId } }),
      this.prisma.commission.groupBy({
        by: ['status'],
        where: { brokerId },
        _count: { _all: true },
        _sum: { brokerAmount: true },
      }),
    ]);

    const ligne = (statut: string) => parStatut.find((l) => l.status === statut);
    const montant = (statut: string) => ligne(statut)?._sum.brokerAmount?.toString() ?? '0';

    return {
      contrats,
      commissions: {
        enAttente: montant('PENDING'),
        reglees: montant('PAID'),
        // Dossiers à arbitrer manuellement, sans montant exploitable.
        tauxNonDefini: ligne('RATE_UNDEFINED')?._count._all ?? 0,
      },
    };
  }
}
