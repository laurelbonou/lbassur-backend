import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { CloudinaryService, STORAGE_FOLDERS } from '../storage/cloudinary.service';

/**
 * Document généré et déposé sur Cloudinary.
 *
 * `url` est signée mais SANS expiration : reçus et contrats sont envoyés au
 * client par email et SMS, il peut les ouvrir des jours plus tard. `publicId`
 * permet de régénérer l'URL ou de supprimer le fichier.
 */
export type GeneratedDocument = {
  url: string;
  publicId: string;
};

/**
 * Code d'agrément LBASSUR au registre des intermédiaires du Ministère des
 * Finances. Figure sur tout dossier transmis à une compagnie.
 */
const LBASSUR_BROKER_CODE = "3610";

/** Doit rester aligné sur l'enum ClaimType de Prisma. */
const CLAIM_TYPE_LABELS: Record<string, string> = {
  COLLISION: "Collision / accident",
  VOL: "Vol",
  INCENDIE: "Incendie",
  BRIS_DE_GLACE: "Bris de glace",
  DEGAT_DES_EAUX: "Dégât des eaux",
  CATASTROPHE_NATURELLE: "Catastrophe naturelle",
  AUTRE: "Autre",
};

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly cloudinary: CloudinaryService) {}

  /**
   * Compose un PDF en mémoire. Rien n'est écrit sur le disque de l'hébergeur,
   * qui est éphémère : le document part directement vers Cloudinary.
   */
  private renderPdf(build: (doc: PDFKit.PDFDocument) => void | Promise<void>): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      Promise.resolve(build(doc))
        .then(() => doc.end())
        .catch(reject);
    });
  }

  private async store(buffer: Buffer, folder: string): Promise<GeneratedDocument> {
    const asset = await this.cloudinary.uploadBuffer(buffer, {
      folder,
      mimeType: 'application/pdf',
    });

    return {
      publicId: asset.publicId,
      url: this.cloudinary.permanentSignedUrl(asset),
    };
  }

  /**
   * Ajoute la signature manuscrite au bas du document. Elle vit désormais sur
   * Cloudinary : on la télécharge pour l'intégrer. Un échec ne doit pas faire
   * perdre le document entier — on trace et on continue sans la signature.
   */
  private async appendSignature(doc: PDFKit.PDFDocument, quoteRequest: any) {
    if (!quoteRequest.signaturePublicId) return;

    try {
      const signature = await this.cloudinary.downloadBuffer({
        publicId: quoteRequest.signaturePublicId,
        resourceType: 'image',
        format: 'png',
      });

      doc.text("Signature de l'assuré :", 50, doc.y, { underline: true });
      doc.moveDown(0.5);
      doc.image(signature, 50, doc.y, { fit: [150, 80] });
    } catch (error) {
      this.logger.error('Signature non intégrée au document', error as Error);
    }
  }

  async generateReceipt(quoteRequest: any, payment: any): Promise<GeneratedDocument> {
    const pdf = await this.renderPdf((doc) => {
      doc.fontSize(20).text('QUITTANCE DE PAIEMENT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`LBAssur - Courtier en Assurance`);
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`);
      doc.moveDown();

      doc.text(`Client : ${quoteRequest.fullName}`);
      doc.text(`Email : ${quoteRequest.email || 'N/A'}`);
      doc.text(`Téléphone : ${quoteRequest.phone}`);
      doc.moveDown();

      doc.text(`Référence du dossier : ${quoteRequest.id}`);
      doc.text(`Référence de paiement : ${payment.reference}`);
      doc.text(`Montant payé : ${payment.amount} XOF`, { underline: true });
      doc.text(`Moyen de paiement : ${payment.method}`);
      doc.moveDown();

      doc
        .fillColor('grey')
        .fontSize(10)
        .text(
          "Ceci est un justificatif de paiement. Il ne constitue pas un contrat d'assurance définitif. Un conseiller vous contactera sous peu.",
          { align: 'center' },
        );
    });

    return this.store(pdf, STORAGE_FOLDERS.receipts);
  }

  async generateFinalContract(quoteRequest: any, insurer: any): Promise<GeneratedDocument> {
    const pdf = await this.renderPdf(async (doc) => {
      doc.fontSize(16).text('LBAssur', 50, 50);
      doc.text(insurer.name, 400, 50, { align: 'right' });
      doc.moveDown(3);

      doc.fontSize(20).text("CONTRAT D'ASSURANCE", { align: 'center' });
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Numéro de Police : ${quoteRequest.policyNumber || 'EN ATTENTE'}`);
      doc.text(`Date d'effet : ${new Date().toLocaleDateString('fr-FR')}`);
      doc.moveDown();

      doc.text("Informations de l'assuré :");
      doc.text(`Nom : ${quoteRequest.fullName}`);
      doc.text(`Téléphone : ${quoteRequest.phone}`);
      doc.moveDown();

      doc.text('Conditions Générales :', { underline: true });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .text(insurer.generalConditions || "Les conditions générales standards s'appliquent.");
      doc.moveDown();

      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/verify/${quoteRequest.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);
      const qrBuffer = Buffer.from(
        qrCodeDataUrl.replace(/^data:image\/png;base64,/, ''),
        'base64',
      );

      doc.image(qrBuffer, 50, doc.y, { fit: [100, 100] });
      doc.text(
        "Scannez ce QR Code pour vérifier l'authenticité de ce contrat.",
        160,
        doc.y + 40,
      );

      doc.moveDown(3);
      await this.appendSignature(doc, quoteRequest);
    });

    return this.store(pdf, STORAGE_FOLDERS.contracts);
  }

  /**
   * Dossier de sinistre destiné à la compagnie.
   *
   * Il doit se suffire à lui-même : le gestionnaire de la compagnie ne se
   * connectera pas à notre espace pour voir les photos. Elles sont donc
   * intégrées au document, pas référencées par un lien.
   */
  async generateClaimReport(claim: any): Promise<GeneratedDocument> {
    const attachments: any[] = claim.attachments ?? [];
    const photos = attachments.filter((f) => f.kind === "PHOTO" && f.publicId);
    const autres = attachments.filter((f) => f.kind !== "PHOTO");

    // Téléchargées avant la composition : pdfkit veut un buffer, et un échec
    // réseau ne doit pas laisser un document à moitié écrit.
    const images: { filename: string; data: Buffer }[] = [];
    for (const photo of photos) {
      try {
        images.push({
          filename: photo.filename,
          data: await this.cloudinary.downloadBuffer(photo),
        });
      } catch (error) {
        this.logger.error(`Photo non intégrée au dossier : ${photo.filename}`, error as Error);
      }
    }

    const pdf = await this.renderPdf((doc) => {
      const ligne = (label: string, valeur?: string | null) => {
        doc.fontSize(10).fillColor("#666").text(`${label} : `, { continued: true });
        doc.fillColor("#000").text(valeur || "Non renseigné");
      };

      // ── En-tête : qui transmet, et sous quel code ──
      doc.fontSize(9).fillColor("#666").text("LBASSUR — Courtier en assurance");
      doc.text(`Code intermédiaire : ${LBASSUR_BROKER_CODE}`);
      doc.moveDown(1.5);

      doc.fontSize(18).fillColor("#000").text("DÉCLARATION DE SINISTRE", { align: "center" });
      doc.fontSize(13).fillColor("#c0392b").text(claim.reference, { align: "center" });
      doc.moveDown(1.5);
      doc.fillColor("#000");

      // ── Assuré et contrat ──
      doc.fontSize(12).text("Assuré et contrat", { underline: true });
      doc.moveDown(0.5);
      ligne("Nom", claim.client?.fullName);
      ligne("Téléphone", claim.client?.phone);
      ligne("Email", claim.client?.email);
      ligne("N° de police", claim.quoteRequest?.policyNumber);
      ligne("Type de contrat", claim.quoteRequest?.insuranceType?.replace("-", " "));
      doc.moveDown();

      // ── Circonstances ──
      doc.fontSize(12).text("Circonstances", { underline: true });
      doc.moveDown(0.5);
      ligne("Nature", CLAIM_TYPE_LABELS[claim.claimType] ?? null);
      ligne("Date", new Date(claim.incidentDate).toLocaleDateString("fr-FR"));
      ligne("Heure", claim.incidentTime);
      ligne("Commune", claim.locationCity);
      ligne("Lieu précis", claim.locationDetails);
      ligne("Déclaré le", new Date(claim.createdAt).toLocaleDateString("fr-FR"));
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("#666").text("Récit de l'assuré :");
      doc.fillColor("#000").text(claim.description, { align: "justify" });
      doc.moveDown();

      // ── Éléments déclarés ──
      doc.fontSize(12).text("Éléments déclarés", { underline: true });
      doc.moveDown(0.5);
      ligne("Blessés", claim.hasInjuries ? "OUI" : "Non");
      ligne("Constat amiable", claim.hasAmicableReport ? "Oui" : "Non");
      ligne("PV de police / plainte", claim.hasPoliceReport ? "Oui" : "Non");
      if (claim.hasPoliceReport) ligne("Référence du PV", claim.policeReportRef);
      doc.moveDown();

      // ── Tiers, seulement s'il y en a un ──
      if (
        claim.thirdPartyName ||
        claim.thirdPartyPlate ||
        claim.thirdPartyInsurer ||
        claim.thirdPartyPolicy
      ) {
        doc.fontSize(12).text("Tiers impliqué", { underline: true });
        doc.moveDown(0.5);
        ligne("Nom", claim.thirdPartyName);
        ligne("Immatriculation", claim.thirdPartyPlate);
        ligne("Compagnie", claim.thirdPartyInsurer);
        ligne("N° de police", claim.thirdPartyPolicy);
        doc.moveDown();
      }

      // ── Pièces non imprimables (notes vocales, documents) ──
      if (autres.length) {
        doc.fontSize(12).text("Autres pièces au dossier", { underline: true });
        doc.moveDown(0.5);
        for (const f of autres) {
          const nature = f.kind === "AUDIO" ? "Note vocale" : "Document";
          doc.fontSize(10).fillColor("#000").text(`• ${nature} — ${f.filename}`);
        }
        doc
          .fontSize(9)
          .fillColor("#666")
          .text("Ces pièces sont conservées par LBASSUR et transmissibles sur demande.");
        doc.moveDown();
      }

      // ── Photos, une par page pour rester lisibles ──
      for (const image of images) {
        doc.addPage();
        doc.fontSize(10).fillColor("#666").text(image.filename);
        doc.moveDown(0.5);
        try {
          doc.image(image.data, { fit: [480, 620], align: "center" });
        } catch (error) {
          doc.fillColor("#c0392b").text("Photo illisible.");
        }
      }
    });

    return this.store(pdf, STORAGE_FOLDERS.claims);
  }

  async generateQuoteSummaryPdf(quoteRequest: any): Promise<GeneratedDocument> {
    const pdf = await this.renderPdf(async (doc) => {
      doc.fontSize(20).text('FICHE DE COTATION', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`LBAssur - Courtier en Assurance`, { align: 'center' });
      doc.text(
        `Date de demande : ${new Date(quoteRequest.createdAt || Date.now()).toLocaleDateString('fr-FR')}`,
        { align: 'center' },
      );
      doc.moveDown(2);

      doc.fontSize(14).text('Informations du Client', { underline: true });
      doc.fontSize(12).moveDown(0.5);
      doc.text(`Nom complet : ${quoteRequest.fullName}`);
      doc.text(`Téléphone : ${quoteRequest.phone}`);
      if (quoteRequest.email) doc.text(`Email : ${quoteRequest.email}`);
      doc.moveDown();

      doc.fontSize(14).text('Détails de la demande', { underline: true });
      doc.fontSize(12).moveDown(0.5);
      doc.text(`Type d'assurance : ${quoteRequest.insuranceType}`);
      doc.moveDown(0.5);

      if (quoteRequest.payload && typeof quoteRequest.payload === 'object') {
        for (const [key, value] of Object.entries(quoteRequest.payload)) {
          const formattedKey =
            key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          const formattedValue = Array.isArray(value) ? value.join(', ') : value;
          doc.text(`${formattedKey} : ${formattedValue}`);
        }
      }
      doc.moveDown(2);

      await this.appendSignature(doc, quoteRequest);
    });

    return this.store(pdf, STORAGE_FOLDERS.contracts);
  }
}
