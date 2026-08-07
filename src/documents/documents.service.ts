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
