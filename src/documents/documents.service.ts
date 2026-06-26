import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');

  constructor() {
    // Ensure directories exist
    this.ensureDirExists(path.join(this.uploadsDir, 'receipts'));
    this.ensureDirExists(path.join(this.uploadsDir, 'contracts'));
  }

  private ensureDirExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async generateReceipt(quoteRequest: any, payment: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `receipt-${quoteRequest.id}-${Date.now()}.pdf`;
        const filePath = path.join(this.uploadsDir, 'receipts', fileName);
        const doc = new PDFDocument({ margin: 50 });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('QUITTANCE DE PAIEMENT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`LBAssur - Courtier en Assurance`);
        doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        // Client Info
        doc.text(`Client : ${quoteRequest.fullName}`);
        doc.text(`Email : ${quoteRequest.email || 'N/A'}`);
        doc.text(`Téléphone : ${quoteRequest.phone}`);
        doc.moveDown();

        // Payment Info
        doc.text(`Référence du dossier : ${quoteRequest.id}`);
        doc.text(`Référence de paiement : ${payment.reference}`);
        doc.text(`Montant payé : ${payment.amount} XOF`, { underline: true });
        doc.text(`Moyen de paiement : ${payment.method}`);
        doc.moveDown();

        // Footer
        doc.fillColor('grey').fontSize(10).text('Ceci est un justificatif de paiement. Il ne constitue pas un contrat d\'assurance définitif. Un conseiller vous contactera sous peu.', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve(`/uploads/receipts/${fileName}`);
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        this.logger.error('Error generating receipt PDF:', error);
        reject(error);
      }
    });
  }

  async generateFinalContract(quoteRequest: any, insurer: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `contract-${quoteRequest.id}-${Date.now()}.pdf`;
        const filePath = path.join(this.uploadsDir, 'contracts', fileName);
        const doc = new PDFDocument({ margin: 50 });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Add Logos (Placeholder text for logos, in real implementation you would use doc.image if logos exist)
        doc.fontSize(16).text('LBAssur', 50, 50);
        doc.text(insurer.name, 400, 50, { align: 'right' });
        doc.moveDown(3);

        // Title
        doc.fontSize(20).text('CONTRAT D\'ASSURANCE', { align: 'center' });
        doc.moveDown();

        // Contract Info
        doc.fontSize(12);
        doc.text(`Numéro de Police : ${quoteRequest.policyNumber || 'EN ATTENTE'}`);
        doc.text(`Date d'effet : ${new Date().toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        // Client Info
        doc.text('Informations de l\'assuré :');
        doc.text(`Nom : ${quoteRequest.fullName}`);
        doc.text(`Téléphone : ${quoteRequest.phone}`);
        doc.moveDown();

        // General Conditions
        doc.text('Conditions Générales :', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(insurer.generalConditions || 'Les conditions générales standards s\'appliquent.');
        doc.moveDown();

        // Generate QR Code for verification
        const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/verify/${quoteRequest.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);
        
        // Convert data URL to Buffer
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
        const qrBuffer = Buffer.from(base64Data, 'base64');
        
        // Add QR code image to PDF
        doc.image(qrBuffer, 50, doc.y, { fit: [100, 100] });
        doc.text('Scannez ce QR Code pour vérifier l\'authenticité de ce contrat.', 160, doc.y + 40);

        // Add Signature if it exists
        if (quoteRequest.signatureUrl) {
          try {
             const relativeSignaturePath = quoteRequest.signatureUrl.replace(/^\//, '');
             const signaturePath = path.join(__dirname, '..', '..', '..', relativeSignaturePath);
             if (fs.existsSync(signaturePath)) {
               doc.moveDown(3);
               doc.text('Signature de l\'assuré :', 50, doc.y, { underline: true });
               doc.moveDown(0.5);
               doc.image(signaturePath, 50, doc.y, { fit: [150, 80] });
             }
          } catch (e) {
             this.logger.error('Could not embed signature', e);
          }
        }

        doc.end();

        stream.on('finish', () => {
          resolve(`/uploads/contracts/${fileName}`);
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        this.logger.error('Error generating contract PDF:', error);
        reject(error);
      }
    });
  }

  async generateQuoteSummaryPdf(quoteRequest: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const fileName = `summary-${quoteRequest.id}-${Date.now()}.pdf`;
        const filePath = path.join(this.uploadsDir, 'contracts', fileName);
        const doc = new PDFDocument({ margin: 50 });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('FICHE DE COTATION', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`LBAssur - Courtier en Assurance`, { align: 'center' });
        doc.text(`Date de demande : ${new Date(quoteRequest.createdAt || Date.now()).toLocaleDateString('fr-FR')}`, { align: 'center' });
        doc.moveDown(2);

        // Client Info
        doc.fontSize(14).text('Informations du Client', { underline: true });
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Nom complet : ${quoteRequest.fullName}`);
        doc.text(`Téléphone : ${quoteRequest.phone}`);
        if (quoteRequest.email) doc.text(`Email : ${quoteRequest.email}`);
        doc.moveDown();

        // Details (Payload)
        doc.fontSize(14).text('Détails de la demande', { underline: true });
        doc.fontSize(12).moveDown(0.5);
        doc.text(`Type d'assurance : ${quoteRequest.insuranceType}`);
        doc.moveDown(0.5);

        if (quoteRequest.payload && typeof quoteRequest.payload === 'object') {
          for (const [key, value] of Object.entries(quoteRequest.payload)) {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            const formattedValue = Array.isArray(value) ? value.join(', ') : value;
            doc.text(`${formattedKey} : ${formattedValue}`);
          }
        }
        doc.moveDown(2);

        // Add Signature if it exists
        if (quoteRequest.signatureUrl) {
          try {
             const relativeSignaturePath = quoteRequest.signatureUrl.replace(/^\//, '');
             const signaturePath = path.join(__dirname, '..', '..', '..', relativeSignaturePath);
             if (fs.existsSync(signaturePath)) {
               doc.text('Signature de l\'assuré :', 50, doc.y, { underline: true });
               doc.moveDown(0.5);
               doc.image(signaturePath, 50, doc.y, { fit: [150, 80] });
             }
          } catch (e) {
             this.logger.error('Could not embed signature', e);
          }
        }

        doc.end();

        stream.on('finish', () => {
          resolve(`/uploads/contracts/${fileName}`);
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        this.logger.error('Error generating summary PDF:', error);
        reject(error);
      }
    });
  }
}
