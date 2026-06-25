import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string, attachments?: any[]) {
    try {
      if (!process.env.SMTP_USER) {
        this.logger.warn(`[Mock Email] To: ${to} | Subject: ${subject}`);
        this.logger.debug(text);
        return;
      }

      const info = await this.transporter.sendMail({
        from: '"LBAssur" <contact@lbassur.bj>', // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html: html || text.replace(/\n/g, '<br>'), // html body
        attachments,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
    }
  }

  async sendWhatsApp(to: string, message: string) {
    // La fonctionnalité WhatsApp a été désactivée à la demande de l'équipe.
    // L'équipe recontactera les clients manuellement par téléphone.
    return;
  }

  // --- Specific Use Cases ---

  async notifyClientReceipt(clientEmail: string, clientPhone: string, receiptUrl: string) {
    const publicUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL : "http://localhost:3000";
    const fullReceiptUrl = receiptUrl.startsWith("http") ? receiptUrl : `${publicUrl}${receiptUrl}`;
    
    const message = `Bonjour,\n\nNous avons bien reçu votre demande et votre paiement.\nVotre quittance est disponible ici : ${fullReceiptUrl}\n\nUn conseiller LBAssur vous fera un retour dans 30 minutes.\n\nMerci de votre confiance.`;
    
    if (clientEmail) {
      await this.sendEmail(
        clientEmail, 
        'Confirmation de votre demande et quittance LBAssur', 
        message
      );
    }
    // Appel désactivé: await this.sendWhatsApp(clientPhone, message);
  }

  async notifyAdminNewQuote(adminEmail: string, quoteId: string) {
    const message = `Une nouvelle demande de souscription (ID: ${quoteId}) a été payée et attend d'être traitée.`;
    await this.sendEmail(adminEmail, 'Nouvelle Souscription LBAssur', message);
    // Appel désactivé: await this.sendWhatsApp(process.env.ADMIN_PHONE || '+22900000000', message);
  }

  async sendQuoteToInsurer(insurerEmail: string, clientDetails: any, documents: any[]) {
    const message = `Bonjour,\n\nVeuillez trouver ci-joint une nouvelle demande de souscription pour le client ${clientDetails.fullName}.\n\nMerci de nous générer le numéro de police correspondant.\n\nCordialement,\nLBAssur`;
    
    // Attachments formatted for nodemailer
    const attachments = documents.map(doc => ({
      filename: doc.filename,
      path: doc.url // Assuming URL is accessible or it's a local path
    }));

    await this.sendEmail(insurerEmail, `Demande de Souscription - ${clientDetails.fullName}`, message, undefined, attachments);
  }

  async sendFinalContractToClient(clientEmail: string, clientPhone: string, contractUrl: string) {
    const message = `Bonjour,\n\nVotre contrat d'assurance est désormais prêt et validé. Vous pouvez le télécharger ici : ${contractUrl}\n\nCordialement,\nLBAssur`;
    
    if (clientEmail) {
      await this.sendEmail(
        clientEmail, 
        'Votre Contrat d\'Assurance Finalisé', 
        message
      );
    }
    // Appel désactivé: await this.sendWhatsApp(clientPhone, message);
  }
}
